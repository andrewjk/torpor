import { expect, test, vi } from "vite-plus/test";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// The animation runtime is only imported by `addAnimation` and installed into
// `context.runAnimations` on first use, so bundle size stays down for apps
// without transitions. This test pins the wiring: a compiled transition still
// plays through `runMountSideEffects` after the split.
const source = `
export default function TransitionMount() {
	function enter() {
		return {
			keyframes: [{ opacity: "0" }, { opacity: "1" }],
			options: { duration: 100 },
		};
	}

	@render {
		<div class="fade" transition={enter}>Hello</div>
	}
}
`;

test("a transition element plays its enter animation on mount", async () => {
	const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate")?.value as
		| Element["animate"]
		| undefined;
	const animate = vi.fn(function () {
		return { finished: Promise.resolve(), timeline: null };
	});
	Element.prototype.animate = animate as unknown as Element["animate"];

	try {
		const container = document.createElement("div");
		const component = await importComponent(import.meta.filename, source, "client");
		mountComponent(container, component);

		expect(container.querySelector(".fade")).not.toBeNull();
		expect(animate).toHaveBeenCalledTimes(1);

		const [keyframes, options] = animate.mock.calls[0] as unknown as [
			Keyframe[],
			KeyframeAnimationOptions,
		];
		expect(keyframes).toEqual([{ opacity: "0" }, { opacity: "1" }]);
		expect(options.direction).toBe("normal");
	} finally {
		if (originalAnimate === undefined) {
			delete (Element.prototype as { animate?: unknown }).animate;
		} else {
			Element.prototype.animate = originalAnimate;
		}
	}
});
