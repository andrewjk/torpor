import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import StepperTest from "./components/StepperTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const oncomplete = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, StepperTest, { ...props, onchange, oncomplete });
	return {
		container,
		onchange,
		oncomplete,
		steps: () => within(container).getAllByRole("listitem"),
		next: () => within(container).getByRole("button", { name: "Next step" }),
		previous: () => within(container).getByRole("button", { name: "Previous step" }),
	};
}

describe("Stepper", () => {
	it("renders one item per step with the first current", async () => {
		const { steps } = setup();

		expect(steps()).toHaveLength(3);
		expect(steps()[0]).toHaveAttribute("data-state", "current");
		expect(steps()[1]).toHaveAttribute("data-state", "upcoming");
	});

	it("marks steps before the current one as complete", async () => {
		const { steps } = setup({ value: 2 });

		expect(steps()[0]).toHaveAttribute("data-state", "complete");
		expect(steps()[1]).toHaveAttribute("data-state", "complete");
		expect(steps()[2]).toHaveAttribute("data-state", "current");
	});

	it("moves to the next step", async () => {
		const { next, steps, onchange } = setup();

		fireEvent.click(next());

		expect(steps()[1]).toHaveAttribute("data-state", "current");
		expect(onchange).toHaveBeenCalledWith(1);
	});

	it("disables the previous control on the first step", async () => {
		const { previous } = setup();

		expect(previous()).toBeDisabled();
	});

	it("moves back with the previous control", async () => {
		const { previous, steps } = setup({ value: 1 });

		fireEvent.click(previous());

		expect(steps()[0]).toHaveAttribute("data-state", "current");
	});

	it("raises oncomplete when moving next from the last step", async () => {
		const { next, oncomplete, steps } = setup({ value: 2 });

		fireEvent.click(next());

		expect(oncomplete).toHaveBeenCalledTimes(1);
		expect(steps()[2]).toHaveAttribute("data-state", "current");
	});

	it("revisits a completed step by clicking it", async () => {
		const { container, steps } = setup({ value: 2 });

		fireEvent.click(within(container).getByRole("button", { name: "Go to Account" }));

		expect(steps()[0]).toHaveAttribute("data-state", "current");
	});

	it("cannot skip ahead in linear mode", async () => {
		const { container, steps } = setup();

		// Upcoming steps render no button in linear mode
		expect(
			within(container).queryByRole("button", { name: "Go to Profile" }),
		).not.toBeInTheDocument();
		expect(steps()[1]).toHaveAttribute("data-state", "upcoming");
	});

	it("can jump to any step when not linear", async () => {
		const { container, steps, onchange } = setup({ linear: false });

		fireEvent.click(within(container).getByRole("button", { name: "Go to Confirm" }));

		expect(steps()[2]).toHaveAttribute("data-state", "current");
		expect(onchange).toHaveBeenCalledWith(2);
	});
});
