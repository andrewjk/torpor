import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import CarouselTest from "./components/CarouselTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, CarouselTest, { ...props, onchange });
	return {
		container,
		onchange,
		carousel: () => within(container).getByRole("region"),
		slides: () => within(container).getAllByRole("group"),
		next: () => within(container).getByRole("button", { name: "Next slide" }),
		previous: () => within(container).getByRole("button", { name: "Previous slide" }),
	};
}

describe("Carousel", () => {
	it("renders one slide container per slide", async () => {
		const { slides } = setup();

		expect(slides()).toHaveLength(3);
	});

	it("shows the first slide initially", async () => {
		const { slides } = setup();

		expect(slides()[0]).toHaveAttribute("data-state", "active");
		expect(slides()[1]).toHaveAttribute("data-state", "inactive");
	});

	it("moves to the next slide", async () => {
		const { next, slides, onchange } = setup();

		fireEvent.click(next());

		expect(slides()[1]).toHaveAttribute("data-state", "active");
		expect(onchange).toHaveBeenCalledWith(1);
	});

	it("wraps around to the first slide from the last", async () => {
		const { next, slides } = setup();

		fireEvent.click(next());
		fireEvent.click(next());
		fireEvent.click(next());

		expect(slides()[0]).toHaveAttribute("data-state", "active");
	});

	it("wraps around to the last slide from the first", async () => {
		const { previous, slides } = setup();

		fireEvent.click(previous());

		expect(slides()[2]).toHaveAttribute("data-state", "active");
	});

	it("does not wrap when wrap is false", async () => {
		const { next, previous, slides } = setup({ wrap: false });

		expect(previous()).toBeDisabled();

		fireEvent.click(next());
		fireEvent.click(next());

		expect(next()).toBeDisabled();
		expect(slides()[2]).toHaveAttribute("data-state", "active");
	});

	it("only renders the active slide's content", async () => {
		const { container, next } = setup();

		expect(container.textContent).toContain("Slide 1");
		expect(container.textContent).not.toContain("Slide 2");

		fireEvent.click(next());

		expect(container.textContent).toContain("Slide 2");
		expect(container.textContent).not.toContain("Slide 1");
	});

	it("moves directly to a slide via its indicator", async () => {
		const { container, slides } = setup();

		fireEvent.click(within(container).getByRole("button", { name: "Go to slide 3" }));

		expect(slides()[2]).toHaveAttribute("data-state", "active");
	});

	it("marks the active indicator", async () => {
		const { container, next } = setup();
		const indicators = within(container).getAllByRole("button", { name: /Go to slide/ });

		expect(indicators[0]).toHaveAttribute("data-state", "active");
		expect(indicators[2]).toHaveAttribute("data-state", "inactive");

		fireEvent.click(next());

		expect(indicators[1]).toHaveAttribute("data-state", "active");
		expect(indicators[0]).toHaveAttribute("data-state", "inactive");
	});
});
