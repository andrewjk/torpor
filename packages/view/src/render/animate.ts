import context from "./context";

/**
 * Adds an animation for an element
 * @param el The element to animate
 * @param enter Whether the animation is being run on enter
 * @param keyframes The Web Animation API keyframes
 * @param options The Web Animmation API options
 */
export default async function animate(
	el: HTMLElement,
	enter: boolean,
	keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
	options?: number | KeyframeAnimationOptions,
): Promise<void> {
	// This is quite simplistic
	// We might need to
	// - store the animation
	// - reverse it if it's running and the range appears/disappears
	// - transfer the animation to the new element
	let animationOptions = Object.assign(
		{
			direction: enter ? "normal" : "reverse",
			// TODO: Should probably have a global setting for these somewhere
			// And respect browser reduce motion settings
			duration: 300,
			easing: "ease-in-out",
			fill: "forwards",
		},
		options,
	);

	const animation = el.animate(keyframes, animationOptions);

	// HACK: I'm not entirely sure why we need to sent the animation's timeline,
	// but without it, animations never start
	// HACK: We also need to make sure the element has been added to the DOM
	// with a timeout
	setTimeout(() => {
		animation.timeline = el.ownerDocument.timeline;
	}, 1);

	// Add the animation to the active range, so that the range won't be cleared
	// until the animation is completed
	let activeRange = context.activeRange;
	if (activeRange) {
		// TODO: An option for whether to await or cancel events on range remove
		// e.g. if you are doing a client side navigation, you don't want to run animations
		activeRange.animations ??= new Set();
		activeRange.animations.add(animation);
		await animation.finished;
	}
}
