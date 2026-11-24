/**
 * Event delegation.
 *
 * For event types in `DELEGATED_EVENT_TYPES` (all natively bubbling), we
 * register a single listener on each element's `ownerDocument` per type and
 * dispatch by walking up from the event target, running each ancestor's
 * stashed handler in turn until one calls `stopPropagation()`.
 * This replaces per-element `addEventListener` for delegated types.
 *
 * Why: in the js-framework-bench row template, every `<tr>` clones two `<a>`
 * elements each with a `click` handler. With per-element `addEventListener`,
 * `runlots` (10k rows) issues 20000 `addEventListener` calls and the browser
 * allocates 20000 `Listener` objects. With delegation it's 2 calls total
 * (one per delegated type, registered lazily on first use) and zero
 * per-element `Listener` allocations — the handler is stored as a property
 * on the element.
 *
 * Model: last-write-wins per element per type (same as Solid's
 * `delegateEvents`). Repeated `t_event(el, "click", h)` calls with the same
 * element reassign the property; calling with `null`/`undefined` clears it.
 * Torpor's compiler emits `t_event(el, type, h)` exactly once per element
 * lifetime (outside any tracked effect), so this is the natural shape.
 *
 * Non-bubbling events (`focus`, `blur`, `scroll`, `load`, `error`, `abort`,
 * `unload`, `resize`, etc.) bypass delegation and use direct
 * `addEventListener` on the element, preserving native semantics.
 *
 * Limitations (inherent to delegating to the document, same trade-off as
 * React and Solid):
 *
 * - A native `stopPropagation()` — third-party code, or a listener added in
 *   `$onmount` — stops the event before it reaches the document, so the
 *   delegated handlers won't run. Torpor handlers can still call
 *   `stopPropagation()` among themselves (that's what ends the walk below).
 * - `stopPropagation()` in a delegated handler runs after the native event
 *   has finished bubbling, so it only affects other delegated handlers, not
 *   native listeners.
 *
 * Shadow DOM and multiple documents are supported: the listener lives on the
 * element's `ownerDocument` (so components mounted into an iframe or popup
 * document work), and the path comes from `composedPath()` (so the listener
 * sees the real target inside a shadow root, not the retargeted host).
 */

const DELEGATED_EVENT_TYPES: ReadonlySet<string> = new Set([
	"auxclick",
	"beforeinput",
	"change",
	"click",
	"compositionend",
	"compositionstart",
	"compositionupdate",
	"contextmenu",
	"dblclick",
	"drag",
	"dragend",
	"dragenter",
	"dragleave",
	"dragover",
	"dragstart",
	"drop",
	"focusin",
	"focusout",
	"input",
	"keydown",
	"keypress",
	"keyup",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup",
	"pointerdown",
	"pointermove",
	"pointerout",
	"pointerover",
	"pointerup",
	"reset",
	"submit",
	"touchend",
	"touchmove",
	"touchstart",
	"wheel",
]);

export function isDelegatedEventType(type: string): boolean {
	return DELEGATED_EVENT_TYPES.has(type);
}

// Property name on each element holding the handler for a given type.
// Matches Solid's `$$`-prefixed convention. Single string property per type,
// so there's no per-element Map allocation — just a named slot on the element.
const DELEGATE_PREFIX = "torp.$$";

// Marker on `document` tracking which types already have a listener
// registered. Storing on `document` (rather than a module-scoped Set) means
// the registration state is correctly scoped to the current document —
// important for tests that swap the global document (rare, but possible).
const DELEGATE_REGISTERED = Symbol.for("torp.delegated.registered");

function delegatedHandler(event: Event): void {
	const stopAt: Node | null = event.currentTarget as Node | null;
	const key = DELEGATE_PREFIX + event.type;
	// Walk the composed path from the deepest target up to (but not
	// including) the listener node (the element's document), running every
	// stashed handler on the way, so nested handlers bubble like native
	// listeners. `stopPropagation()` (or `stopImmediatePropagation()`) in a
	// handler sets `cancelBubble`, which ends the walk.
	//
	// `composedPath()` rather than `event.target` + `parentNode`: at the
	// document, an event from inside a shadow root is retargeted to the
	// shadow host, so the real target and the elements between it and the
	// host are only visible in the composed path.
	const path = event.composedPath();
	for (let i = 0; i < path.length; i++) {
		const node = path[i];
		if (node === stopAt) {
			break;
		}
		const handler = (node as any)[key];
		if (handler !== undefined) {
			// Override `currentTarget` so the user's handler sees the element
			// the handler was attached to, not the document. `currentTarget`
			// is otherwise read-only. Configurable so the override can be
			// removed below.
			Object.defineProperty(event, "currentTarget", {
				configurable: true,
				value: node,
				writable: false,
			});
			try {
				(handler as (this: Node, ev: Event) => any).call(node as Node, event);
			} finally {
				// Remove the override so the prototype getter takes over
				// again (returns `null` once dispatch completes).
				delete (event as any).currentTarget;
			}
			if (event.cancelBubble) {
				return;
			}
		}
	}
}

function ensureDelegatedListener(doc: Document, type: string): void {
	let registered = (doc as any)[DELEGATE_REGISTERED] as Set<string> | undefined;
	if (!registered) {
		registered = new Set();
		(doc as any)[DELEGATE_REGISTERED] = registered;
	}
	if (registered.has(type)) return;
	registered.add(type);
	// Bubble phase (default). All events in DELEGATED_EVENT_TYPES bubble, so
	// the listener fires after the event has traversed the target and any
	// intermediary elements — matching the natural event flow the user
	// expects from `addEventListener` on the element itself.
	doc.addEventListener(type, delegatedHandler);
}

/**
 * Attach a delegated event handler to an element.
 *
 * Stores the handler as a property on the element and ensures a single
 * listener exists for the type on the element's own document (so components
 * mounted into another document — an iframe or popup — get delegated events
 * too). Idempotent for the document-level listener: the first call for a
 * given type registers it, subsequent calls are a Set-has check.
 *
 * Passing `null` or `undefined` as the listener clears any previously-set
 * handler for that type on the element (mirroring `addEvent`'s existing
 * null-skipping semantics, extended to support explicit removal).
 */
export function attachDelegatedEvent(
	el: Element,
	type: string,
	listener: ((this: Element, ev: any) => any) | undefined | null,
): void {
	const key = DELEGATE_PREFIX + type;
	if (listener === undefined || listener === null) {
		(el as any)[key] = undefined;
		return;
	}
	const doc = el.ownerDocument;
	if (
		doc === null ||
		// Guard against non-DOM documents (e.g. a template document) that
		// don't implement event listeners
		typeof doc.addEventListener !== "function"
	) {
		return;
	}
	ensureDelegatedListener(doc, type);
	(el as any)[key] = listener;
}

// Property on an element recording its direct (non-delegated) listeners, so
// a dynamic-element tag swap (`t_dynamic`) can re-attach them. Direct
// listeners are the rare path (focus, blur, scroll, …), so the extra
// per-element array is acceptable next to the delegated-handler slots.
const DIRECT_LISTENERS = "torp.$directListeners";

/**
 * Records a direct (non-delegated) listener on the element at attach time,
 * so `copyEventListeners` can re-attach it after a dynamic-element tag
 * swap. `addEventListener` listeners can't be discovered after the fact.
 */
export function recordDirectListener(
	el: Element,
	type: string,
	listener: (this: Element, ev: any) => any,
): void {
	let list = (el as any)[DIRECT_LISTENERS] as
		| { type: string; listener: (this: Element, ev: any) => any }[]
		| undefined;
	if (!list) {
		list = [];
		(el as any)[DIRECT_LISTENERS] = list;
	}
	list.push({ type, listener });
}

/**
 * Copies the event listeners attached to one element onto another — used by
 * `t_dynamic` so a dynamic element keeps its listeners when its tag changes.
 * Delegated handlers are `torp.$$<type>` properties, copied per known
 * delegated type (swaps are rare, so the fixed set of checks is fine);
 * direct listeners are re-registered from the list `recordDirectListener`
 * built at attach time.
 */
export function copyEventListeners(from: Element, to: Element): void {
	for (const type of DELEGATED_EVENT_TYPES) {
		const key = DELEGATE_PREFIX + type;
		const handler = (from as any)[key];
		if (handler !== undefined) {
			(to as any)[key] = handler;
		}
	}
	const direct = (from as any)[DIRECT_LISTENERS] as
		| { type: string; listener: (this: Element, ev: any) => any }[]
		| undefined;
	if (direct) {
		(to as any)[DIRECT_LISTENERS] = direct;
		for (const { type, listener } of direct) {
			to.addEventListener(type, listener);
		}
	}
}
