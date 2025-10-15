import { type Animation } from "@torpor/view";

export default function fade(
	_el: HTMLElement,
	options?: number | KeyframeAnimationOptions,
): Animation {
	const keyframes = [
		{
			opacity: 0,
		},
		{
			opacity: 1,
		},
	];
	return { keyframes, options };
}
