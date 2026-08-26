import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SliderFormTest from "./components/SliderFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("Slider (in forms)", () => {
	it("uses the Field's name for its form value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderFormTest, {});

		expect(container.querySelector('input[type="hidden"]')).toHaveAttribute("name", "volume");
	});

	it("validates on blur and as the value changes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SliderFormTest, {});

		const slider = within(container).getByRole("slider");

		// Value starts at 10, below the minimum of 50; blurring validates
		fireEvent.blur(slider);
		await tick();

		expect(within(container).getByText("Volume must be at least 50")).toBeInTheDocument();
		expect(slider).toHaveAttribute("aria-invalid", "true");

		// End jumps to the maximum, which revalidates and passes
		fireEvent.keyDown(slider, { key: "End" });
		await tick();

		expect(within(container).queryByText("Volume must be at least 50")).toBeNull();
		expect(slider).not.toHaveAttribute("aria-invalid");
	});
});
