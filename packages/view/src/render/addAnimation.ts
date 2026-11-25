import type Animation from "../types/Animation";
import context from "./context";
import runAnimations from "./runAnimations";

export default function addAnimation(el: HTMLElement, entry?: Animation, exit?: Animation): void {
	// Install the runner that `runMountSideEffects` calls. Done here (rather
	// than at module scope) so this module stays side-effect free: when no
	// compiled component references `t_animate`, bundlers can drop this module,
	// `runAnimations`, and `animate.ts` together.
	context.runAnimations ??= runAnimations;

	// Stash the event in context so that it can be added when the fragment is
	// added to the DOM
	// NOTE: We don't need to do this for hydration, but it's simpler to do it
	// the same way in both processes
	context.stashedAnimations.push({
		region: context.activeRegion,
		el,
		in: entry,
		out: exit,
	});
}
