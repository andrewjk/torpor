import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import FormListTest from "./components/FormListTest.torp";
import FormTabsTest from "./components/FormTabsTest.torp";

function formData(container: HTMLElement, formId: string): FormData {
	return new FormData(container.querySelector(`#${formId}`) as HTMLFormElement);
}

describe("Components in forms", () => {
	it("ListBox submits its selected value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FormListTest, {});

		// Nothing selected initially
		expect(formData(container, "form-under-test").get("colors")).toBeNull();

		fireEvent.click(within(container).getByText("Green"));

		expect(formData(container, "form-under-test").get("colors")).toBe("green");
	});

	it("Slider submits its current value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FormListTest, { sliderValue: 30 });

		const slider = within(container).getByRole("slider");
		fireEvent.keyDown(slider, { key: "ArrowUp" });

		expect(formData(container, "form-under-test").get("volume")).toBe("40");
	});

	it("Tree submits its selected value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, FormTabsTest);

		expect(formData(container, "tree-form").get("picked")).toBe("item-2");

		fireEvent.click(within(container).getByText("Folder 1"));
		expect(formData(container, "tree-form").get("picked")).toBe("item-1");
	});
});
