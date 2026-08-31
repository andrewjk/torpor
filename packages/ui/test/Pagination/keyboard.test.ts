import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vite-plus/test";
import PaginationWithTriggers from "./components/PaginationWithTriggers.torp";

describe("Pagination - Keyboard", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("navigation triggers work with click", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithTriggers);

		const prevButton = getByText(container, "‹");
		await userEvent.click(prevButton);

		const active = container.querySelector('[data-state="active"]');
		expect(active?.textContent?.trim()).toBe("4");
	});

	it("can navigate to first page", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithTriggers);

		const startButton = getByText(container, "«");
		await userEvent.click(startButton);

		const active = container.querySelector('[data-state="active"]');
		expect(active?.textContent?.trim()).toBe("1");
	});

	it("can navigate to last page", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PaginationWithTriggers);

		const endButton = getByText(container, "»");
		await userEvent.click(endButton);

		const active = container.querySelector('[data-state="active"]');
		expect(active?.textContent?.trim()).toBe("20");
	});
});
