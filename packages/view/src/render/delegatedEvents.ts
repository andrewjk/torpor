/**
 * Event delegation.
 *
 * For event types in `DELEGATED_EVENT_TYPES` (all natively bubbling), we
 * register a single listener on `document` per type and dispatch by walking
 * up from `event.target` to find the closest ancestor with a stashed handler.
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
	let node: Node | null = event.target as Node | null;
	const stopAt: Node | null = event.currentTarget as Node | null;
	const key = DELEGATE_PREFIX + event.type;
	// Walk from the deepest target up to (but not including) the listener
	// node (document). First ancestor with a stashed handler wins.
	while (node != null && node !== stopAt) {
		const handler = (node as any)[key];
		if (handler !== undefined) {
			// Override `currentTarget` so the user's handler sees the element
			// the handler was attached to, not `document`. `currentTarget`
			// is otherwise read-only. Configurable so the override can be
			// removed below.
			Object.defineProperty(event, "currentTarget", {
				configurable: true,
				value: node,
				writable: false,
			});
			try {
				(handler as (this: Node, ev: Event) => any).call(node, event);
			} finally {
				// Remove the override so the prototype getter takes over
				// again (returns `null` once dispatch completes).
				delete (event as any).currentTarget;
			}
			return;
		}
		node = node.parentNode;
	}
}

function ensureDelegatedListener(type: string): void {
	if (typeof document === "undefined") return;
	let registered = (document as any)[DELEGATE_REGISTERED] as Set<string> | undefined;
	if (!registered) {
		registered = new Set();
		(document as any)[DELEGATE_REGISTERED] = registered;
	}
	if (registered.has(type)) return;
	registered.add(type);
	// Bubble phase (default). All events in DELEGATED_EVENT_TYPES bubble, so
	// the listener at `document` fires after the event has traversed the
	// target and any intermediary elements — matching the natural event flow
	// the user expects from `addEventListener` on the element itself.
	document.addEventListener(type, delegatedHandler);
}

/**
 * Attach a delegated event handler to an element.
 *
 * Stores the handler as a property on the element and ensures a single
 * document-level listener exists for the type. Idempotent for the
 * document-level listener: the first call for a given type registers it,
 * subsequent calls are a Set-has check.
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
	ensureDelegatedListener(type);
	(el as any)[key] = listener;
}
