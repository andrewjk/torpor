import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import SortableListTest from "./components/SortableListTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountList(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, SortableListTest as any, props);
	return container;
}

function items(container: HTMLElement): HTMLElement[] {
	return [...container.querySelectorAll<HTMLElement>(".torp-sortable-list-item")];
}

describe("SortableList", () => {
	it("renders its items in order", () => {
		const container = mountList();
		const list = within(container).getByRole("list", { name: "Steps" });
		expect(
			within(list)
				.getAllByRole("listitem")
				.map((el) => el.textContent?.trim()),
		).toEqual(["one", "two", "three"]);
	});

	it("moves an item down with Alt+ArrowDown", async () => {
		const onchange = vi.fn();
		const onmove = vi.fn();
		const container = mountList({ onchange, onmove });
		const [first] = items(container);

		first.focus();
		fireEvent.keyDown(first, { key: "ArrowDown", altKey: true });
		await tick();

		expect(container.querySelector(".result")).toHaveTextContent("two,one,three");
		expect(onmove).toHaveBeenCalledWith(0, 1);
		expect(onchange).toHaveBeenCalledTimes(1);
		expect(within(container).getByRole("status")).toHaveTextContent(
			"Moved one to position 2 of 3.",
		);
	});

	it("moves an item up with Alt+ArrowUp", async () => {
		const container = mountList();
		const last = items(container)[2];

		last.focus();
		fireEvent.keyDown(last, { key: "ArrowUp", altKey: true });
		await tick();

		expect(container.querySelector(".result")).toHaveTextContent("one,three,two");
	});

	it("moves an item to an end with Alt+Home and Alt+End", async () => {
		const container = mountList();
		const [first] = items(container);
		first.focus();
		fireEvent.keyDown(first, { key: "End", altKey: true });
		await tick();
		expect(container.querySelector(".result")).toHaveTextContent("two,three,one");

		const last = items(container)[2];
		last.focus();
		fireEvent.keyDown(last, { key: "Home", altKey: true });
		await tick();
		expect(container.querySelector(".result")).toHaveTextContent("one,two,three");
	});

	it("reorders with native drag and drop", async () => {
		const container = mountList();
		const [first, second] = items(container);
		const types = new Set<string>();
		const store = new Map<string, string>();
		const transfer = {
			types,
			effectAllowed: "",
			dropEffect: "",
			getData: (type: string) => store.get(type) ?? "",
			setData: (type: string, value: string) => {
				types.add(type);
				store.set(type, value);
			},
		};
		const drag = (type: string, clientY = 0) => {
			const event = new Event(type, { bubbles: true, cancelable: true });
			(event as any).dataTransfer = transfer;
			(event as any).clientY = clientY;
			return event;
		};

		fireEvent(first, drag("dragstart"));
		fireEvent(second, drag("dragover", 10));
		fireEvent(second, drag("drop", 10));
		await tick();

		// Dropped past the second item's midpoint, so it lands after it
		expect(container.querySelector(".result")).toHaveTextContent("two,one,three");
	});

	it("ignores keyboard moves when disabled", async () => {
		const container = mountList({ disabled: true });
		const [first] = items(container);
		expect(first).toHaveAttribute("tabindex", "-1");

		fireEvent.keyDown(first, { key: "ArrowDown", altKey: true });
		await tick();
		expect(container.querySelector(".result")).toHaveTextContent("one,two,three");
	});
});
