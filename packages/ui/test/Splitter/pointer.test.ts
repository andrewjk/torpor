import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SplitterTest from "./components/SplitterTest.torp";

function setup(
	props: Record<string, unknown> = {},
	rect = { left: 0, top: 0, width: 200, height: 400 },
) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SplitterTest, props);

	// jsdom has no layout, so give the container a size
	const root = container.getElementsByClassName("torp-splitter")[0] as HTMLElement;
	root.getBoundingClientRect = () =>
		({
			x: rect.left,
			y: rect.top,
			left: rect.left,
			top: rect.top,
			right: rect.left + rect.width,
			bottom: rect.top + rect.height,
			width: rect.width,
			height: rect.height,
			toJSON: () => ({}),
		}) as DOMRect;

	return { container, handle: () => within(container).getByRole("separator") };
}

describe("Splitter (pointer)", () => {
	it("sets the value from the pointer position", async () => {
		const { handle } = setup();

		fireEvent.mouseDown(handle(), { clientX: 50, clientY: 0 });

		expect(handle()).toHaveAttribute("aria-valuenow", "25");
	});

	it("drags the separator with mouse move and stops on mouse up", async () => {
		const { handle } = setup();

		fireEvent.mouseDown(handle(), { clientX: 20, clientY: 0 });
		fireEvent.mouseMove(window, { clientX: 100, clientY: 0 });
		expect(handle()).toHaveAttribute("aria-valuenow", "50");

		fireEvent.mouseUp(window);
		fireEvent.mouseMove(window, { clientX: 10, clientY: 0 });

		// After mouse up the value should no longer change
		expect(handle()).toHaveAttribute("aria-valuenow", "50");
	});

	it("works with a vertical orientation", async () => {
		const { handle } = setup({ orientation: "vertical" });

		fireEvent.mouseDown(handle(), { clientX: 0, clientY: 100 });

		expect(handle()).toHaveAttribute("aria-valuenow", "25");
	});

	it("clamps positions outside the container", async () => {
		const { handle } = setup();

		fireEvent.mouseDown(handle(), { clientX: -50, clientY: 0 });
		expect(handle()).toHaveAttribute("aria-valuenow", "0");

		fireEvent.mouseDown(handle(), { clientX: 500, clientY: 0 });
		expect(handle()).toHaveAttribute("aria-valuenow", "100");
	});
});
