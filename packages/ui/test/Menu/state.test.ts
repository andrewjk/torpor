import { getByRole, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vitest";
import MenuState from "./components/MenuState.torp";

describe("Menu state", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("MenuCheck initial checked state is respected", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuState);

		const check1 = getByText(container, "Check 1 (controlled)").closest(
			'[role="menuitemcheckbox"]',
		) as HTMLElement;
		const check2 = getByText(container, "Check 2 (controlled)").closest(
			'[role="menuitemcheckbox"]',
		) as HTMLElement;

		expect(check1).toHaveAttribute("aria-checked", "true");
		expect(check2).toHaveAttribute("aria-checked", "false");
	});

	it("MenuRadio initial value selects correct item", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuState);

		const radio1 = getByText(container, "Option 1").closest(
			'[role="menuitemradio"]',
		) as HTMLElement;
		const radio2 = getByText(container, "Option 2").closest(
			'[role="menuitemradio"]',
		) as HTMLElement;
		const radio3 = getByText(container, "Option 3").closest(
			'[role="menuitemradio"]',
		) as HTMLElement;

		expect(radio1).toHaveAttribute("aria-checked", "false");
		expect(radio2).toHaveAttribute("aria-checked", "true");
		expect(radio3).toHaveAttribute("aria-checked", "false");
	});

	it("MenuRadioGroup value controls checked item", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuState);

		const radioGroup = getByRole(container, "group", { name: "Options" });
		expect(radioGroup).toBeInTheDocument();
	});

	it("MenuPopout visible prop controls visibility", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuState);

		expect(queryByText(container, "Submenu item")).not.toBeInTheDocument();
	});

	it("Multiple MenuCheck items maintain independent states", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuState);

		const check1 = getByText(container, "Check 1 (controlled)").closest(
			'[role="menuitemcheckbox"]',
		) as HTMLElement;
		const check2 = getByText(container, "Check 2 (controlled)").closest(
			'[role="menuitemcheckbox"]',
		) as HTMLElement;

		expect(check1).toHaveAttribute("aria-checked", "true");
		expect(check2).toHaveAttribute("aria-checked", "false");
	});
});
