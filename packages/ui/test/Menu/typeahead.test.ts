import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import MenuTypeAhead from "./components/MenuTypeAhead.torp";

describe("Menu type-ahead", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("typing a character focuses the next item starting with it", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuTypeAhead);

		getByText(container, "Alpha").focus();
		await userEvent.keyboard("a");
		expect(getByText(container, "Alpha 2")).toHaveFocus();
	});

	it("typing the same character again cycles through matching items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuTypeAhead);

		getByText(container, "Alpha").focus();
		await userEvent.keyboard("a");
		expect(getByText(container, "Alpha 2")).toHaveFocus();
		await userEvent.keyboard("a");
		expect(getByText(container, "Alpha")).toHaveFocus();
	});

	it("searching wraps around to the start of the menu", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuTypeAhead);

		getByText(container, "Alpha 2").focus();
		await userEvent.keyboard("g");
		expect(getByText(container, "Gamma")).toHaveFocus();
	});

	it("typing multiple characters in quick succession searches for the string", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuTypeAhead);

		getByText(container, "Gamma").focus();
		await userEvent.keyboard("al");
		expect(getByText(container, "Alpha 2")).toHaveFocus();
	});

	it("type-ahead skips disabled items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MenuTypeAhead);

		getByText(container, "Alpha").focus();
		await userEvent.keyboard("b");
		expect(getByText(container, "Alpha")).toHaveFocus();
	});
});
