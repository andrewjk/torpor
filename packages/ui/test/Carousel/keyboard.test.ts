import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import CarouselTest from "./components/CarouselTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, CarouselTest, props);
	return {
		container,
		carousel: () => within(container).getByRole("region"),
		slides: () => within(container).getAllByRole("group"),
	};
}

describe("Carousel (keyboard)", () => {
	it("ArrowRight moves to the next slide", async () => {
		const { carousel, slides } = setup();

		fireEvent.keyDown(carousel(), { key: "ArrowRight" });

		expect(slides()[1]).toHaveAttribute("data-state", "active");
	});

	it("ArrowLeft moves to the previous slide", async () => {
		const { carousel, slides } = setup();

		fireEvent.keyDown(carousel(), { key: "ArrowLeft" });

		expect(slides()[2]).toHaveAttribute("data-state", "active");
	});

	it("Home moves to the first slide and End to the last", async () => {
		const { carousel, slides } = setup();

		fireEvent.keyDown(carousel(), { key: "End" });
		expect(slides()[2]).toHaveAttribute("data-state", "active");

		fireEvent.keyDown(carousel(), { key: "Home" });
		expect(slides()[0]).toHaveAttribute("data-state", "active");
	});

	it("does not handle keys that target a button inside the carousel", async () => {
		const { container, slides } = setup();

		// ArrowRight on the next button itself does not double-move: the
		// button handles it (or ignores it), not the carousel
		const next = within(container).getByRole("button", { name: "Next slide" });
		fireEvent.keyDown(next, { key: "ArrowRight" });

		expect(slides()[0]).toHaveAttribute("data-state", "active");
	});
});
