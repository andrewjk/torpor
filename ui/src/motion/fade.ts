import animate from "../../../view/src/motion/animate";

export default async function fade(
	el: HTMLElement,
	enter: boolean,
	options?: KeyframeAnimationOptions,
) {
	const animationFrames = [{ opacity: 0 }, { opacity: 1 }];
	/*
	let animationOptions: KeyframeEffectOptions = {
		direction: enter ? "normal" : "reverse",
		duration: 2500,
		fill: "forwards",
	};
	animationOptions = Object.assign(animationOptions, options);

	const animation = el.animate(animationFrames, animationOptions);
    */
	animate(el, enter, animationFrames, options);
}
