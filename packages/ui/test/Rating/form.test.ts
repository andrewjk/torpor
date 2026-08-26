import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import RatingFormTest from "./components/RatingFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("Rating (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingFormTest, {});

		fireEvent.click(within(container).getAllByRole("radio")[0]);

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "score");
	});

	it("validates on blur and when a rating is chosen", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingFormTest, {});

		const radios = within(container).getAllByRole("radio");

		// One star fails the minimum of 3; focus leaving validates
		fireEvent.click(radios[0]);
		fireEvent.focusOut(radios[0]);
		await tick();

		expect(within(container).getByText("Give at least 3 stars")).toBeInTheDocument();
		expect(within(container).getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");

		// Three stars pass
		fireEvent.click(radios[2]);
		await tick();

		expect(within(container).queryByText("Give at least 3 stars")).toBeNull();
	});
});
