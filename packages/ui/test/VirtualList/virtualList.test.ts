import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import VirtualListTest from "./components/VirtualListTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountList(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, VirtualListTest as any, props);
	return container;
}

function rendered(container: HTMLElement): number[] {
	return [...container.querySelectorAll<HTMLElement>(".torp-virtual-list-item")].map((el) =>
		Number(el.dataset.index),
	);
}

describe("VirtualList", () => {
	it("renders only the visible window of a large list", () => {
		const container = mountList({ items: Array.from({ length: 1000 }, (_, i) => `Item ${i}`) });
		const list = within(container).getByRole("list", { name: "Items" });

		const indexes = rendered(container);
		expect(indexes[0]).toBe(0);
		expect(indexes.length).toBeGreaterThan(0);
		expect(indexes.length).toBeLessThan(30);
		expect(within(list).getByText("Item 0")).toBeInTheDocument();
		expect(within(list).queryByText("Item 999")).toBeNull();
	});

	it("renders the window around the scroll position", async () => {
		const container = mountList({ items: Array.from({ length: 1000 }, (_, i) => `Item ${i}`) });
		const list = within(container).getByRole("list", { name: "Items" });

		list.scrollTop = 400;
		fireEvent.scroll(list);
		await tick();

		const indexes = rendered(container);
		expect(indexes[0]).toBe(17);
		expect(indexes).not.toContain(0);
		expect(within(list).queryByText("Item 20")).toBeInTheDocument();
	});

	it("uses a fixed row height for layout", () => {
		const container = mountList({ items: ["one", "two", "three"], height: 100 });
		const spacer = container.querySelector<HTMLElement>(".torp-virtual-list-spacer")!;
		expect(spacer).toHaveStyle({ height: "60px" });
	});
});
