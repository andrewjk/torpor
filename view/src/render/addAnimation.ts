import { type Animation } from "../types/Animation";
import context from "./context";

export default function addAnimation(el: HTMLElement, entry?: Animation, exit?: Animation) {
	// Stash the event in context so that it can be added when the fragment is
	// added to the DOM
	// NOTE: We don't need to do this for hydration, but it's simpler to do it
	// the same way in both processes
	context.stashedAnimations.push({
		range: context.activeRange,
		el,
		in: entry,
		out: exit,
	});
}
