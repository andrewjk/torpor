import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import RatingTest from "./components/RatingTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, RatingTest, props);
	return { container, stars: () => within(container).getAllByRole("radio") };
}

describe("Rating (keyboard)", () => {
	it("ArrowRight increases the value by one and moves focus", async () => {
		const { stars } = setup({ value: 2 });

		fireEvent.keyDown(stars()[1], { key: "ArrowRight" });

		expect(stars()[2]).toHaveAttribute("aria-checked", "true");
		expect(stars()[2]).toHaveFocus();
	});

	it("ArrowLeft decreases the value by one and moves focus", async () => {
		const { stars } = setup({ value: 3 });

		fireEvent.keyDown(stars()[2], { key: "ArrowLeft" });

		expect(stars()[1]).toHaveAttribute("aria-checked", "true");
		expect(stars()[1]).toHaveFocus();
	});

	it("ArrowUp and ArrowDown match ArrowRight and ArrowLeft", async () => {
		const { stars } = setup({ value: 2 });

		fireEvent.keyDown(stars()[1], { key: "ArrowUp" });
		expect(stars()[2]).toHaveAttribute("aria-checked", "true");

		fireEvent.keyDown(stars()[2], { key: "ArrowDown" });
		expect(stars()[1]).toHaveAttribute("aria-checked", "true");
	});

	it("ArrowLeft does not go below one star", async () => {
		const { stars } = setup({ value: 1 });

		fireEvent.keyDown(stars()[0], { key: "ArrowLeft" });

		expect(stars()[0]).toHaveAttribute("aria-checked", "true");
	});

	it("Home moves to one star and End to the maximum", async () => {
		const { stars } = setup({ value: 3, max: 5 });

		fireEvent.keyDown(stars()[2], { key: "End" });
		expect(stars()[4]).toHaveAttribute("aria-checked", "true");
		expect(stars()[4]).toHaveFocus();

		fireEvent.keyDown(stars()[4], { key: "Home" });
		expect(stars()[0]).toHaveAttribute("aria-checked", "true");
		expect(stars()[0]).toHaveFocus();
	});

	it("moves the tab stop to the selected star", async () => {
		const { stars } = setup({ value: 3 });

		expect(stars()[2]).toHaveAttribute("tabindex", "0");
		expect(stars()[0]).toHaveAttribute("tabindex", "-1");

		fireEvent.keyDown(stars()[2], { key: "ArrowRight" });

		expect(stars()[3]).toHaveAttribute("tabindex", "0");
		expect(stars()[2]).toHaveAttribute("tabindex", "-1");
	});

	it("the first star is the tab stop when there is no value", async () => {
		const { stars } = setup();

		expect(stars()[0]).toHaveAttribute("tabindex", "0");
	});

	it("does nothing when disabled", async () => {
		const { stars } = setup({ value: 2, disabled: true });

		fireEvent.keyDown(stars()[1], { key: "ArrowRight" });

		expect(stars()[1]).toHaveAttribute("aria-checked", "true");
	});
});
