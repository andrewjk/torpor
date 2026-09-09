import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import RatingComposedTest from "./components/RatingComposedTest.torp";
import RatingTest from "./components/RatingTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, RatingTest, { ...props, onchange });
	return { container, onchange, rating: () => within(container).getByRole("radiogroup") };
}

function stars(container: HTMLElement) {
	return within(container).getAllByRole("radio");
}

describe("Rating", () => {
	it("renders the given number of stars", async () => {
		const { container } = setup({ max: 7 });

		expect(stars(container)).toHaveLength(7);
	});

	it("defaults to five stars", async () => {
		const { container } = setup();

		expect(stars(container)).toHaveLength(5);
	});

	it("clicking a star sets the value", async () => {
		const { container, onchange } = setup();

		fireEvent.click(stars(container)[2]);

		expect(stars(container)[2]).toHaveAttribute("aria-checked", "true");
		expect(onchange).toHaveBeenCalledWith(3);
	});

	it("marks stars up to the value as filled", async () => {
		const { container } = setup({ value: 3 });

		const all = stars(container);
		expect(all[0]).toHaveAttribute("data-state", "filled");
		expect(all[1]).toHaveAttribute("data-state", "filled");
		expect(all[2]).toHaveAttribute("data-state", "filled");
		expect(all[3]).toHaveAttribute("data-state", "empty");
		expect(all[4]).toHaveAttribute("data-state", "empty");
	});

	it("clicking the current value clears the rating", async () => {
		const { container, onchange } = setup({ value: 4 });

		fireEvent.click(stars(container)[3]);

		expect(stars(container).every((s) => s.getAttribute("aria-checked") === "false")).toBe(true);
		expect(onchange).toHaveBeenCalledWith(0);
	});

	it("does not clear the rating when allowClear is false", async () => {
		const { container, onchange } = setup({ value: 4, allowClear: false });

		fireEvent.click(stars(container)[3]);

		expect(stars(container)[3]).toHaveAttribute("aria-checked", "true");
		expect(onchange).not.toHaveBeenCalled();
	});

	it("hovering a star previews the fill", async () => {
		const { container } = setup({ value: 1 });

		fireEvent.mouseEnter(stars(container)[3]);

		expect(stars(container)[3]).toHaveAttribute("data-state", "filled");

		fireEvent.mouseLeave(container.querySelector(".torp-rating")!);

		expect(stars(container)[3]).toHaveAttribute("data-state", "empty");
	});

	it("ignores clicks when disabled", async () => {
		const { container, onchange } = setup({ disabled: true });

		fireEvent.click(stars(container)[2]);

		expect(stars(container).every((s) => s.getAttribute("aria-checked") === "false")).toBe(true);
		expect(onchange).not.toHaveBeenCalled();
	});

	it("clamps the initial value to the maximum", async () => {
		const { container } = setup({ value: 9 });

		expect(stars(container)[4]).toHaveAttribute("aria-checked", "true");
	});
});

describe("Rating (subcomponents)", () => {
	function setupComposed(props: Record<string, unknown> = {}) {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingComposedTest, { ...props, onchange });
		return { container, onchange };
	}

	it("renders the stars automatically with no children", async () => {
		const { container } = setup({ max: 3 });

		expect(stars(container)).toHaveLength(3);
	});

	it("renders explicitly composed stars with their own props", async () => {
		const { container } = setupComposed({ value: 2, starClass: "custom-star" });

		const all = stars(container);
		expect(all).toHaveLength(5);
		expect(all[0]).toHaveClass("torp-rating-star", "custom-star");
		expect(all[1]).toHaveAttribute("aria-checked", "true");
	});

	it("renders custom star content through the slot", async () => {
		const { container } = setupComposed({ glyph: "♥" });

		expect(stars(container)[0].textContent).toBe("♥");
	});

	it("clicking a composed star sets the value", async () => {
		const { container, onchange } = setupComposed();

		fireEvent.click(stars(container)[2]);

		expect(stars(container)[2]).toHaveAttribute("aria-checked", "true");
		expect(onchange).toHaveBeenCalledWith(3);
	});
});
