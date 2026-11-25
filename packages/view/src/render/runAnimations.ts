import $run from "../watch/$run";
import animate from "./animate";
import context from "./context";

/**
 * Runs the animations stashed by `addAnimation` (`context.stashedAnimations`)
 * when their element has been added to the DOM.
 *
 * Kept in its own module (imported only by `addAnimation`) rather than in
 * `runMountSideEffects`: this way a component that never uses a
 * `transition`/`transition-in`/`transition-out` attribute never imports
 * `t_animate`, so this module — and `animate.ts` with it — is tree-shaken
 * out of the bundle. `runMountSideEffects` reaches the runner through
 * `context.runAnimations`, which stays null until `addAnimation` installs it.
 */
export default function runAnimations(): void {
	// Set the active region for each animation so it will get attached to
	// the right one and set it back afterwards
	// Don't await animations
	for (let animation of context.stashedAnimations) {
		context.activeRegion = animation.region;
		$run(function runMountSideEffectsAnimation() {
			if (animation.in !== undefined) {
				// eslint-disable-next-line no-floating-promises
				animate(animation.el, true, animation.in.keyframes, animation.in.options);
			}
			if (animation.out !== undefined) {
				return () => {
					// eslint-disable-next-line no-floating-promises
					animate(animation.el, false, animation.out!.keyframes, animation.out!.options);
				};
			}
		});
	}
	context.stashedAnimations.length = 0;
}
