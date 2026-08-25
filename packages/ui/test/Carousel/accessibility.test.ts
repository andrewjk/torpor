import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import CarouselTest from "./components/CarouselTest.torp";

describe("Carousel (accessibility)", () => {
	it("is a carousel region with an accessible name", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CarouselTest, {});

		const region = within(container).getByRole("region", { name: "Featured" });
		expect(region).toHaveAttribute("aria-roledescription", "carousel");
	});

	it("labels slides as slides with their position", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CarouselTest, {});

		const slides = within(container).getAllByRole("group");
		expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
		expect(slides[0]).toHaveAttribute("aria-label", "1 of 3");
		expect(slides[2]).toHaveAttribute("aria-label", "3 of 3");
	});

	it("labels the previous and next controls", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CarouselTest, {});

		expect(within(container).getByRole("button", { name: "Previous slide" })).toBeInTheDocument();
		expect(within(container).getByRole("button", { name: "Next slide" })).toBeInTheDocument();
	});

	it("labels each indicator with its slide", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, CarouselTest, {});

		expect(within(container).getByRole("button", { name: "Go to slide 1" })).toBeInTheDocument();
		expect(within(container).getByRole("button", { name: "Go to slide 2" })).toBeInTheDocument();
		expect(within(container).getByRole("button", { name: "Go to slide 3" })).toBeInTheDocument();
	});
});
