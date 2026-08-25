import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import RatingTest from "./components/RatingTest.torp";

describe("Rating (accessibility)", () => {
	it("is a radiogroup with an accessible name", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingTest, { ariaLabel: "Movie rating" });

		expect(within(container).getByRole("radiogroup", { name: "Movie rating" })).toBeInTheDocument();
	});

	it("renders radios labelled with their star count", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingTest, {});

		expect(within(container).getByRole("radio", { name: "1 star" })).toBeInTheDocument();
		expect(within(container).getByRole("radio", { name: "3 stars" })).toBeInTheDocument();
		expect(within(container).getByRole("radio", { name: "5 stars" })).toBeInTheDocument();
	});

	it("checks the star matching the value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingTest, { value: 2 });

		const stars = within(container).getAllByRole("radio");
		expect(stars[1]).toHaveAttribute("aria-checked", "true");
		expect(stars.filter((s) => s.getAttribute("aria-checked") === "true")).toHaveLength(1);
	});

	it("marks a disabled rating", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingTest, { disabled: true });

		expect(within(container).getByRole("radiogroup")).toHaveAttribute("aria-disabled", "true");
		expect(within(container).getAllByRole("radio")[0]).toHaveAttribute("aria-disabled", "true");
	});
});
