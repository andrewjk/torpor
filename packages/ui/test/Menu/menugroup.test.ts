import { getByRole, getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vitest";
import MenuGroupTest from "./components/MenuGroupTest.torp";

describe("MenuGroup", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("has role='group'", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuGroupTest);

		const groups = container.querySelectorAll('[role="group"]');
		expect(groups).toHaveLength(2);
	});

	it("has aria-label when provided", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuGroupTest);

		const group = getByRole(container, "group", { name: "Actions" });
		expect(group).toBeInTheDocument();
		expect(group).toHaveAttribute("aria-label", "Actions");
	});

	it("contains the correct menu items", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuGroupTest);

		const actionsGroup = getByRole(container, "group", { name: "Actions" });
		expect(actionsGroup).toContainElement(getByText(container, "Action 1"));
		expect(actionsGroup).toContainElement(getByText(container, "Action 2"));
		expect(actionsGroup).not.toContainElement(getByText(container, "Other 1"));
	});
});
