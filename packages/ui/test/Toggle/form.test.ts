import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import ToggleFormTest from "./components/ToggleFormTest.torp";

describe("Toggle (in forms)", () => {
	it("submits its name and value in form data when checked", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleFormTest, { checked: true });

		const input = within(container).getByRole("switch") as HTMLInputElement;
		expect(input.name).toBe("notifications");

		const form = container.querySelector("#test-form") as HTMLFormElement;
		expect(new FormData(form).get("notifications")).toBe("on");
	});

	it("contributes no form data when unchecked", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleFormTest, {});

		const form = container.querySelector("#test-form") as HTMLFormElement;
		expect(new FormData(form).get("notifications")).toBeNull();

		fireEvent.click(within(container).getByRole("switch"));
		expect(new FormData(form).get("notifications")).toBe("on");
	});

	it("is excluded from form data when disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ToggleFormTest, { checked: true, disabled: true });

		const form = container.querySelector("#test-form") as HTMLFormElement;
		expect(new FormData(form).get("notifications")).toBeNull();
	});
});
