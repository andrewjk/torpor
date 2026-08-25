import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import StepperTest from "./components/StepperTest.torp";

describe("Stepper (accessibility)", () => {
	it("is a labelled list of steps", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StepperTest, {});

		const list = container.getElementsByClassName("torp-stepper-steps")[0];
		expect(list).toHaveAttribute("aria-label", "Sign up");
		expect(within(container).getAllByRole("listitem")).toHaveLength(3);
	});

	it("marks the current step with aria-current", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StepperTest, { value: 1 });

		const steps = within(container).getAllByRole("listitem");
		expect(steps[1]).toHaveAttribute("aria-current", "step");
		expect(steps[0]).not.toHaveAttribute("aria-current");
	});

	it("labels revisitable steps", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StepperTest, { value: 2 });

		expect(within(container).getByRole("button", { name: "Go to Account" })).toBeInTheDocument();
		expect(within(container).getByRole("button", { name: "Go to Profile" })).toBeInTheDocument();
	});
});
