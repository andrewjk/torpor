import { type Animation } from "@torpor/view";
import measure from "./measure";

interface Options extends KeyframeAnimationOptions {
	side: "left" | "right" | "top" | "bottom";
}

export default function fade(el: HTMLElement, options?: Options): Animation {
	let position = options?.side ?? "left";
	switch (position) {
		case "left": {
			el.style.left = "0px";
			const width = measure(el, (el) => el.offsetWidth);
			const keyframes = [
				{ transform: `translateX(-${width}px)` },
				{ transform: "translateX(0px)" },
			];
			return { keyframes, options };
		}
		case "top": {
			el.style.top = "0px";
			const height = measure(el, (el) => el.offsetHeight);
			const keyframes = [
				{ transform: `translateY(-${height}px)` },
				{ transform: "translateY(0px)" },
			];
			return { keyframes, options };
		}
		case "right": {
			el.style.right = "0px";
			const width = measure(el, (el) => el.offsetWidth);
			const keyframes = [{ transform: `translateX(${width}px)` }, { transform: "translateX(0px)" }];
			return { keyframes, options };
		}
		case "bottom": {
			el.style.bottom = "0px";
			const height = measure(el, (el) => el.offsetHeight);
			const keyframes = [
				{ transform: `translateY(${height}px)` },
				{ transform: "translateY(0px)" },
			];
			return { keyframes, options };
		}
	}
}
