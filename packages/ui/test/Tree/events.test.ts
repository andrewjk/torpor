import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import TreeEvents from "./components/TreeEvents.torp";

describe("Tree (events)", () => {
	it("raises onchange when an item is selected", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeEvents, { onchange });

		fireEvent.click(within(container).getByText("File 2"));

		expect(onchange).toHaveBeenCalledWith("file-2");
	});

	it("raises onexpand when an item is expanded", async () => {
		const onexpand = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TreeEvents, { onexpand });

		const trigger = container.querySelector("button.torp-tree-item-trigger")!;
		fireEvent.click(trigger);

		expect(onexpand).toHaveBeenCalledWith(["folder-1"]);
	});
});
