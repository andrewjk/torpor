import { expect, test, vi } from "vite-plus/test";
import animate from "../../src/render/animate";
import context from "../../src/render/context";
import type Region from "../../src/types/Region";

function setup() {
	const el = document.createElement("div");
	const region = { animations: null } as unknown as Region;
	context.activeRegion = region;

	let finish!: () => void;
	const finished = new Promise<void>((resolve) => (finish = resolve));
	const animation = {
		finished,
		timeline: null,
		cancel: vi.fn(),
		reverse: vi.fn(),
		play: vi.fn(),
	} as unknown as Animation;
	const animateFn = vi.fn(() => animation);
	el.animate = animateFn as unknown as Element["animate"];

	return { el, animateFn, finish };
}

function lastTransform(keyframes: Keyframe[] | PropertyIndexedKeyframes | null): unknown {
	if (Array.isArray(keyframes)) {
		return keyframes[keyframes.length - 1]?.transform;
	}
	const transform = keyframes?.transform;
	return Array.isArray(transform) ? transform[transform.length - 1] : transform;
}

test("enter animation ending on an identity transform ends on none", async () => {
	const { el, animateFn, finish } = setup();

	const done = animate(el, true, [
		{ transform: "translateY(8px)" },
		{ transform: "translateY(0px)" },
	]);

	const [keyframes, options] = animateFn.mock.calls[0] as unknown as [
		Keyframe[],
		KeyframeAnimationOptions,
	];
	expect(lastTransform(keyframes)).toBe("none");
	expect(options.fill).toBe("forwards");

	finish();
	await done;
});

test("enter animation keeps a non-identity final transform", async () => {
	const { el, animateFn, finish } = setup();

	const done = animate(el, true, [
		{ transform: "translateY(8px)" },
		{ transform: "translateY(3px)" },
	]);

	const [keyframes] = animateFn.mock.calls[0] as unknown as [Keyframe[]];
	expect(lastTransform(keyframes)).toBe("translateY(3px)");

	finish();
	await done;
});

test("exit animation keeps its final transform", async () => {
	const { el, animateFn, finish } = setup();

	const done = animate(el, false, [{ transform: "translateY(0px)" }]);

	const [keyframes] = animateFn.mock.calls[0] as unknown as [Keyframe[]];
	expect(lastTransform(keyframes)).toBe("translateY(0px)");

	finish();
	await done;
});

test("caller-opted-out fill keeps its final transform", async () => {
	const { el, animateFn, finish } = setup();

	const done = animate(el, true, [{ transform: "translateY(0px)" }], { fill: "none" });

	const [keyframes] = animateFn.mock.calls[0] as unknown as [Keyframe[]];
	expect(lastTransform(keyframes)).toBe("translateY(0px)");

	finish();
	await done;
});

test("property-indexed keyframes ending on an identity transform end on none", async () => {
	const { el, animateFn, finish } = setup();

	const done = animate(el, true, { transform: ["translateY(8px)", "translateY(0)"] });

	const [keyframes] = animateFn.mock.calls[0] as unknown as [PropertyIndexedKeyframes];
	expect(lastTransform(keyframes)).toBe("none");

	finish();
	await done;
});

test.each([
	"none",
	"translateY(0px)",
	"translate(0, 0%)",
	"translate3d(0px, 0, 0)",
	"scale(1)",
	"scale3d(1, 1, 1)",
	"rotate(0deg)",
	"rotate3d(1, 2, 3, 0)",
	"skew(0, 0)",
	"matrix(1, 0, 0, 1, 0, 0)",
	"matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)",
	"translate(0px, 0px) scale(1) rotate(0deg)",
])("identity transform %s ends on none", async (transform) => {
	const { el, animateFn, finish } = setup();

	const done = animate(el, true, [{ transform }, { transform }]);

	const [keyframes] = animateFn.mock.calls[0] as unknown as [Keyframe[]];
	expect(lastTransform(keyframes)).toBe("none");

	finish();
	await done;
});

test.each([
	"translateY(1px)",
	"scale(1.01)",
	"rotate(1deg)",
	"matrix(1, 0, 0, 1, 1, 0)",
	"var(--slide)",
])("non-identity transform %s is kept", async (transform) => {
	const { el, animateFn, finish } = setup();

	const done = animate(el, true, [{ transform: "none" }, { transform }]);

	const [keyframes] = animateFn.mock.calls[0] as unknown as [Keyframe[]];
	expect(lastTransform(keyframes)).toBe(transform);

	finish();
	await done;
});
