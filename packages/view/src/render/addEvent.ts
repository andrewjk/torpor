import context from "./context";

export default function addEvent(
	el: Element,
	type: string,
	listener: ((this: Element, ev: any) => any) | undefined | null,
): void {
	// Stash the event in context so that it can be added when the fragment is
	// added to the DOM
	// NOTE: We don't need to do this for hydration, but it's simpler to do it
	// the same way in both processes
	if (listener !== undefined && listener !== null) {
		// NOTE: `region` is intentionally omitted — it was stashed historically
		// but never read by `addFragment` (the consumer). Dropping it removes
		// one property write per `addEvent` call (2 per list item in the
		// js-framework-bench row template, ~2000 writes per 1k-row create).
		context.stashedEvents.push({ el, type, listener });
	}
}
