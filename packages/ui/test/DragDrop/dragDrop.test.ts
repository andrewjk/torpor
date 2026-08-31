import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { dragState, endDrag, resolveDrag } from "../../src/utils/dragState";
import DragDropTest from "./components/DragDropTest.torp";

/** A minimal dataTransfer stub: real transfers are unreadable outside drop */
function makeTransfer() {
	const types = new Set<string>();
	const store = new Map<string, string>();
	return {
		types,
		effectAllowed: "",
		dropEffect: "",
		getData: (type: string) => store.get(type) ?? "",
		setData: (type: string, value: string) => {
			types.add(type);
			store.set(type, value);
		},
	};
}

/** Builds a drag lifecycle event carrying a shared dataTransfer */
function drag(type: string, transfer: any): Event {
	const event = new Event(type, { bubbles: true, cancelable: true });
	(event as any).dataTransfer = transfer;
	return event;
}

describe("drag & drop", () => {
	afterEach(() => {
		// Tests may abandon drags mid-lifecycle; dragend would clear this in
		// a real browser
		endDrag();
		document.body.innerHTML = "";
	});

	it("tracks the active drag between source and target", async () => {
		const ondrop = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DragDropTest as any, { ondrop });

		const item = container.querySelector(".item")!;
		const panel = container.querySelector(".panel")!;
		const transfer = makeTransfer();

		expect(dragState.current).toBeUndefined();

		fireEvent(item, drag("dragstart", transfer));
		expect(dragState.current?.kind).toBe("list-item");
		expect(dragState.current?.data).toEqual({ label: "item" });

		const dropEvent = drag("drop", transfer) as DragEvent;
		fireEvent(panel, dropEvent);
		expect(ondrop).toHaveBeenCalledTimes(1);
		expect(ondrop.mock.calls[0][0].kind).toBe("list-item");
		// preventDefault was called so the browser doesn't navigate
		expect(dropEvent.defaultPrevented).toBe(true);

		// dragend clears the tracked drag
		fireEvent(item, drag("dragend", transfer));
		expect(dragState.current).toBeUndefined();
	});

	it("dropTarget rejects drags of other kinds", async () => {
		const ondrop = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DragDropTest as any, { ondrop });

		const foreign = container.querySelector(".foreign")!;
		const panel = container.querySelector(".panel")!;
		const transfer = makeTransfer();

		fireEvent(foreign, drag("dragstart", transfer));

		const overEvent = drag("dragover", transfer);
		fireEvent(panel, overEvent);
		expect(overEvent.defaultPrevented).toBe(false);

		const dropEvent = drag("drop", transfer);
		fireEvent(panel, dropEvent);
		expect(dropEvent.defaultPrevented).toBe(true); // still prevents navigation
		expect(ondrop).not.toHaveBeenCalled();
	});

	it("applies the hover class and honors effect negotiation", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DragDropTest as any, { effect: "copy" });

		const item = container.querySelector(".item")!;
		const panel = container.querySelector(".panel")! as HTMLElement;
		const transfer = makeTransfer();

		fireEvent(item, drag("dragstart", transfer));
		fireEvent(panel, drag("dragover", transfer));

		expect(panel.classList.contains("dropping")).toBe(true);
		expect(transfer.dropEffect).toBe("copy");

		// Leaving the target to somewhere else removes the class
		fireEvent(panel, drag("dragleave", transfer));
		expect(panel.classList.contains("dropping")).toBe(false);
	});

	it("an ondrop returning false rejects the drop", async () => {
		const ondrop = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DragDropTest as any, { ondrop, reject: true });

		const item = container.querySelector(".item")!;
		const panel = container.querySelector(".panel")!;
		const transfer = makeTransfer();

		fireEvent(item, drag("dragstart", transfer));
		fireEvent(panel, drag("drop", transfer));

		// The callback ran but the drop result is up to the component
		expect(ondrop).toHaveBeenCalledTimes(1);
	});

	it("onstart returning false cancels the drag entirely", () => {
		const onend = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DragDropTest as any, { onstart: () => false, onend });

		const item = container.querySelector(".item")!;
		const transfer = makeTransfer();

		fireEvent(item, drag("dragstart", transfer));
		expect(dragState.current).toBeUndefined();

		// dragend without a start is a no-op
		fireEvent(item, drag("dragend", transfer));
		expect(onend).not.toHaveBeenCalled();
	});

	it("resolveDrag verifies the encoded id against the live drag", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DragDropTest as any, {});

		const item = container.querySelector(".item")!;
		const transfer = makeTransfer();

		// No drag in progress
		expect(resolveDrag({ dataTransfer: transfer } as unknown as DragEvent)).toBeUndefined();

		fireEvent(item, drag("dragstart", transfer));
		const current = dragState.current!;
		expect(current.id).toBeTruthy();

		// Matching id resolves; a mismatched one is treated as foreign
		expect(resolveDrag({ dataTransfer: transfer } as unknown as DragEvent)).toBe(current);
		const wrongTransfer = makeTransfer();
		wrongTransfer.setData(`application/x-torpor-drag/999`, "999");
		expect(resolveDrag({ dataTransfer: wrongTransfer } as unknown as DragEvent)).toBeUndefined();
	});
});
