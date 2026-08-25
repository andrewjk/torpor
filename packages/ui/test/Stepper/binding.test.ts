import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import StepperBindingTest from "./components/StepperBindingTest.torp";

describe("Stepper (binding)", () => {
	it("syncs the value both ways", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StepperBindingTest, {});

		expect(within(container).getByText("0")).toBeInTheDocument();

		fireEvent.click(within(container).getByRole("button", { name: "Next step" }));

		expect(within(container).getByText("1")).toBeInTheDocument();
	});
});
