import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import SplitterTest from "./components/SplitterTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SplitterTest, { ...props, onchange });
	return { container, onchange, handle: () => within(container).getByRole("separator") };
}

describe("Splitter", () => {
	it("renders two panes and a separator", async () => {
		const { container } = setup();

		expect(container.getElementsByClassName("torp-splitter-pane")).toHaveLength(2);
		expect(within(container).getByRole("separator")).toBeInTheDocument();
	});

	it("defaults to an even split", async () => {
		const { handle } = setup();

		expect(handle()).toHaveAttribute("aria-valuenow", "50");
	});

	it("sizes the primary pane to the value", async () => {
		const { container, handle } = setup({ value: 30 });

		expect(handle()).toHaveAttribute("aria-valuenow", "30");
		const pane = container.getElementsByClassName("torp-splitter-pane")[0] as HTMLElement;
		expect(pane.getAttribute("style")).toContain("0 0 30%");
	});

	it("shares the arrow keys between orientations", async () => {
		const { handle } = setup();

		fireEvent.keyDown(handle(), { key: "ArrowRight" });
		expect(handle()).toHaveAttribute("aria-valuenow", "51");

		// Vertical arrows do nothing on a horizontal splitter
		fireEvent.keyDown(handle(), { key: "ArrowUp" });
		expect(handle()).toHaveAttribute("aria-valuenow", "51");
	});

	it("clamps the value to the min and max", async () => {
		const { handle, onchange } = setup({ value: 99, max: 80 });

		expect(handle()).toHaveAttribute("aria-valuenow", "80");

		fireEvent.keyDown(handle(), { key: "ArrowRight" });
		expect(handle()).toHaveAttribute("aria-valuenow", "80");
		expect(onchange).not.toHaveBeenCalled();
	});

	it("does nothing when disabled", async () => {
		const { handle, onchange } = setup({ disabled: true });

		fireEvent.keyDown(handle(), { key: "ArrowRight" });

		expect(handle()).toHaveAttribute("aria-valuenow", "50");
		expect(onchange).not.toHaveBeenCalled();
	});
});
