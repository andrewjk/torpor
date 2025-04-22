import context from "./context";

export default function addEvent(
	el: Element,
	type: string,
	listener: (this: Element, ev: any) => any,
): void {
	// Stash the event in context so that it can be added when the fragment is
	// added to the DOM
	// NOTE: We don't need to do this for hydration, but it's simpler to do it
	// the same way in both processes
	context.stashedEvents.push({ range: context.activeRange, el, type, listener });
}
