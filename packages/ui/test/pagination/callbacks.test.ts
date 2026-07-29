import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vitest";
import PaginationWithCallbacks from "./components/PaginationWithCallbacks.torp";

describe("Pagination - Callbacks", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("renders initial state", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithCallbacks);

		const lastClicked = container.querySelector("#last-clicked");
		expect(lastClicked?.textContent).toBe("");
	});

	it("ontoggle is called on page change", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithCallbacks);

		const page3 = getByText(container, "3");
		(page3 as HTMLElement).click();

		const lastClicked = container.querySelector("#last-clicked");
		expect(lastClicked?.textContent).toContain("Page");
	});
});
