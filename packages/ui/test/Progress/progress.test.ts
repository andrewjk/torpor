import { within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import ProgressTest from "./components/ProgressTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, ProgressTest, props);
	return { container, progress: () => within(container).getByRole("progressbar") };
}

describe("Progress", () => {
	it("is a progressbar with value attributes", async () => {
		const { progress } = setup({ value: 30 });

		expect(progress()).toHaveAttribute("aria-valuemin", "0");
		expect(progress()).toHaveAttribute("aria-valuemax", "100");
		expect(progress()).toHaveAttribute("aria-valuenow", "30");
	});

	it("has an accessible name from the ariaLabel prop", async () => {
		const { progress } = setup({ ariaLabel: "Uploading" });

		expect(progress()).toHaveAccessibleName("Uploading");
	});

	it("supports a custom range", async () => {
		const { progress } = setup({ value: 5, min: 0, max: 10 });

		expect(progress()).toHaveAttribute("aria-valuemax", "10");
		expect(progress()).toHaveAttribute("aria-valuenow", "5");
	});

	it("clamps the value to the range", async () => {
		const { progress } = setup({ value: 150, max: 100 });

		expect(progress()).toHaveAttribute("aria-valuenow", "100");
	});

	it("supports a human-readable value text", async () => {
		const { progress } = setup({ value: 3, valuetext: "3 of 10 files" });

		expect(progress()).toHaveAttribute("aria-valuetext", "3 of 10 files");
	});

	it("is indeterminate when there is no value", async () => {
		const { progress } = setup();

		expect(progress()).not.toHaveAttribute("aria-valuenow");
		expect(progress()).not.toHaveAttribute("aria-valuemin");
		expect(progress()).not.toHaveAttribute("aria-valuemax");
		expect(progress()).toHaveAttribute("data-state", "indeterminate");
	});

	it("sizes the bar to the value's percentage", async () => {
		const { container } = setup({ value: 40 });

		const bar = container.querySelector(".torp-progress-bar")!;
		expect(bar).toHaveAttribute("data-state", "determinate");
		expect(bar.getAttribute("style")).toContain("width: 40%");
	});
});
