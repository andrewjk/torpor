import context from "./context";

export default function addAnimation(
	el: HTMLElement,
	inKeyframes: Keyframe[] | PropertyIndexedKeyframes | null,
	inOptions: number | KeyframeAnimationOptions | undefined,
	outKeyframes: Keyframe[] | PropertyIndexedKeyframes | null,
	outOptions: number | KeyframeAnimationOptions | undefined,
) {
	// Stash the event in context so that it can be added when the fragment is
	// added to the DOM
	// NOTE: We don't need to do this for hydration, but it's simpler to do it
	// the same way in both processes
	context.stashedAnimations.push({
		range: context.activeRange,
		el,
		inKeyframes,
		inOptions,
		outKeyframes,
		outOptions,
	});
}
