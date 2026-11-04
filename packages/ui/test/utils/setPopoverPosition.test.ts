import { expect, test } from "vite-plus/test";
import setPopoverPosition from "../../src/utils/setPopoverPosition";

function rect(left: number, top: number, width: number, height: number): DOMRect {
	return {
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
		x: left,
		y: top,
		toJSON() {},
	} as DOMRect;
}

test("positioning measures the content after taking it out of flow", () => {
	const anchor = document.createElement("button");
	const content = document.createElement("div");

	anchor.getBoundingClientRect = () => rect(300, 500, 100, 40);
	// In normal flow the content measures as a full-width block; fixed
	// positioning shrink-wraps it. The measurement must see the latter.
	content.getBoundingClientRect = () =>
		content.style.position === "fixed" ? rect(0, 0, 100, 20) : rect(0, 0, 2000, 20);

	setPopoverPosition(anchor, content, "bottom", "center");

	expect(content.style.position).toBe("fixed");
	expect(content.style.top).toBe("540px");
	expect(content.style.left).toBe("300px");
});

test("positioning clamps the chosen axis when neither side fits", () => {
	const anchor = document.createElement("button");
	const content = document.createElement("div");

	anchor.getBoundingClientRect = () => rect(300, 200, 100, 40);
	// Taller than the viewport, so there is no room above or below
	content.getBoundingClientRect = () => rect(0, 0, 100, 1000);

	setPopoverPosition(anchor, content, "bottom", "start");

	expect(content.style.top).toBe("0px");
	expect(content.style.left).toBe("300px");
});

test("left/right placement clamps the horizontal axis", () => {
	const anchor = document.createElement("button");
	const content = document.createElement("div");

	anchor.getBoundingClientRect = () => rect(100, 200, 100, 40);
	// Wider than the viewport, so there is no room to the left
	content.getBoundingClientRect = () => rect(0, 0, 2000, 20);

	setPopoverPosition(anchor, content, "left", "start");

	expect(content.style.left).toBe("0px");
});
