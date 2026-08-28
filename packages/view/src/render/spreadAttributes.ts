import { attachDelegatedEvent, isDelegatedEventType } from "./delegatedEvents";
import setAttribute from "./setAttribute";

type EventListener = (this: Element, ev: any) => any;

/**
 * The last-applied state of a spread attribute, so that a re-apply can
 * remove the attributes and listeners of entries that have been dropped
 * from the spread object.
 */
interface SpreadState {
	names: Set<string>;
	listeners: Map<string, EventListener | null | undefined>;
}

// Keyed by element, then by a per-call-site id (the compiler passes the
// attribute's index), so that multiple spread attributes on one element
// don't overwrite each other's state
const spreadStates = new WeakMap<Element, Map<number, SpreadState>>();

/**
 * Applies the entries of a spread attribute object (`{...attrs}`) to an
 * element, and keeps them in sync: on each re-run, entries that have been
 * dropped from the object get their attributes / listeners removed.
 *
 * - `false`, `undefined` and `null` values remove the attribute (matching
 *   `t_attribute`); anything else is set as a string.
 * - Keys starting with `on` are added as event listeners (delegated for
 *   bubbling types, direct `addEventListener` otherwise).
 */
export default function spreadAttributes(
	el: Element,
	attrs: Record<string, any> | undefined | null,
	id = 0,
): void {
	let states = spreadStates.get(el);
	if (states === undefined) {
		states = new Map();
		spreadStates.set(el, states);
	}
	let state = states.get(id);
	if (state === undefined) {
		state = { names: new Set(), listeners: new Map() };
		states.set(id, state);
	}

	const names = new Set<string>();

	if (attrs != null) {
		for (let [name, value] of Object.entries(attrs)) {
			names.add(name);
			if (name.startsWith("on")) {
				const type = name.substring(2);
				const listener = value as EventListener | null | undefined;
				if (isDelegatedEventType(type)) {
					// Delegated handlers are last-write-wins element
					// properties, so re-applying on every run is cheap
					attachDelegatedEvent(el, type, listener);
				} else {
					const prev = state.listeners.get(type);
					if (prev != null && prev !== listener) {
						el.removeEventListener(type, prev);
					}
					if (listener != null) {
						el.addEventListener(type, listener);
					}
				}
				state.listeners.set(type, listener);
			} else {
				setAttribute(el, name, value);
			}
		}
	}

	// Remove attributes and listeners whose entries have been dropped
	for (let name of state.names) {
		if (!names.has(name)) {
			el.removeAttribute(name);
		}
	}
	for (let [type, listener] of state.listeners) {
		if (!names.has(`on${type}`)) {
			if (isDelegatedEventType(type)) {
				attachDelegatedEvent(el, type, null);
			} else if (listener != null) {
				el.removeEventListener(type, listener);
			}
			state.listeners.delete(type);
		}
	}
	state.names = names;
}
