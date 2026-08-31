import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import VirtualDataGridTest from "./components/VirtualDataGridTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function getWrap(container: HTMLElement): HTMLElement {
	return container.querySelector(".torp-data-grid-wrap")!;
}

function getBodyRows(container: HTMLElement): HTMLElement[] {
	return [
		...container.querySelectorAll("tbody tr[data-cell], tbody tr:not(.torp-data-grid-spacer)"),
	].filter((tr) => tr.querySelector("[data-cell]")) as HTMLElement[];
}

describe("DataGrid - virtualization", () => {
	it("renders all rows when not virtual", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, VirtualDataGridTest as any, { count: 100 });

		await tick();
		expect(getBodyRows(container).length).toBe(100);
	});

	it("renders only the visible window when virtual", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, VirtualDataGridTest as any, {
			count: 500,
			virtual: true,
			rowHeight: 10,
			height: 100,
			overscan: 2,
		});

		await tick();
		const rows = getBodyRows(container);
		// Viewport of 10 rows plus overscan on both sides
		expect(rows.length).toBeLessThanOrEqual(15);
		expect(rows.length).toBeGreaterThan(0);

		// Window starts at the top by default
		expect(within(rows[0]).getByText("Item 0")).toBeInTheDocument();
	});

	it("scrolling moves the rendered window", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, VirtualDataGridTest as any, {
			count: 500,
			virtual: true,
			rowHeight: 10,
			height: 100,
			overscan: 2,
		});
		await tick();

		const wrap = getWrap(container);
		wrap.scrollTop = 3000; // row ~300
		fireEvent.scroll(wrap);
		await tick();

		const labels = getBodyRows(container).map((tr) => tr.textContent!.trim());
		expect(labels.some((t) => t === "Item 299" || t === "Item 298")).toBe(true);
		expect(labels.every((t) => Number(t.replace("Item ", "")) > 250)).toBe(true);
	});

	it("spacers fill the space outside the window", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, VirtualDataGridTest as any, {
			count: 500,
			virtual: true,
			rowHeight: 10,
			height: 100,
			overscan: 2,
		});
		await tick();

		const wrap = getWrap(container);
		wrap.scrollTop = 2000;
		fireEvent.scroll(wrap);
		await tick();

		const spacers = [...container.querySelectorAll(".torp-data-grid-spacer td")];
		expect(spacers.length).toBe(2);
		for (let td of spacers) {
		}
	});

	it("keyboard navigation scrolls the window to keep focus visible", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, VirtualDataGridTest as any, {
			count: 500,
			virtual: true,
			rowHeight: 10,
			height: 100,
			overscan: 2,
		});
		await tick();

		const wrap = getWrap(container);
		expect(wrap.scrollTop).toBe(0);

		// Focus the first cell and arrow down past the bottom edge
		const firstCell = container.querySelector<HTMLElement>('[data-cell="0:0"]')!;
		firstCell.focus();
		for (let i = 0; i < 25; i++) {
			fireEvent(firstCell, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		}
		await tick();

		// 25 rows exceeds the visible 10 + overscan; the viewport must move
		expect(wrap.scrollTop).toBeGreaterThan(0);
	});

	it("reports aria-rowcount for virtual grids without a loader", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, VirtualDataGridTest as any, {
			count: 500,
			virtual: true,
			rowHeight: 10,
			height: 100,
		});
		await tick();

		const table = within(container).getByRole("grid");
		expect(table).toHaveAttribute("aria-rowcount", "500");
	});
});
