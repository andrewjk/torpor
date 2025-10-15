import { type Animation } from "@torpor/view";
import measure from "./measure";

export default function grow(
	el: HTMLElement,
	options?: number | KeyframeAnimationOptions,
): Animation {
	const height = measure(el, (el) => el.clientHeight);
	const keyframes = [
		{
			height: "0px",
			overflow: "hidden",
			paddingTop: "0px",
			paddingBottom: "0px",
			marginTop: "0px",
			marginBottom: "0px",
		},
		{
			height: height + "px",
		},
	];
	return { keyframes, options };
}
