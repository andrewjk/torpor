import { afterEach, expect, test, vi } from "vite-plus/test";
import { createPopoutContent } from "../../src/utils/popoutContent";

class FakeResizeObserver {
	static instances: FakeResizeObserver[] = [];

	callback: ResizeObserverCallback;
	disconnected = false;

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
		FakeResizeObserver.instances.push(this);
	}

	observe(): void {}
	unobserve(): void {}
	disconnect(): void {
		this.disconnected = true;
	}
}

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

afterEach(() => {
	vi.unstubAllGlobals();
	FakeResizeObserver.instances = [];
});

test("repositions when the content resizes while open", () => {
	vi.stubGlobal("ResizeObserver", FakeResizeObserver);

	const anchor = document.createElement("button");
	const content = document.createElement("div");
	document.body.append(anchor, content);

	let contentWidth = 100;
	anchor.getBoundingClientRect = () => rect(300, 100, 100, 20);
	content.getBoundingClientRect = () =>
		content.style.position === "fixed" ? rect(0, 0, contentWidth, 20) : rect(0, 0, 2000, 20);

	const popout = createPopoutContent({
		getAnchor: () => anchor,
		getContent: () => content,
		close: () => {},
		side: "bottom",
		alignment: "center",
	});

	popout.show();
	expect(content.style.left).toBe("300px");

	// The real content arrives after opening and is much wider
	contentWidth = 600;
	const observer = FakeResizeObserver.instances[0]!;
	observer.callback([], observer as unknown as ResizeObserver);

	expect(content.style.left).toBe("50px");

	popout.hide();
	expect(observer.disconnected).toBe(true);
});
