import { describe, expect, it } from "vite-plus/test";
import { moveItem, moveToSlot, slotIndex } from "../../src/utils/reorderList";

function el(x: number, y: number, w = 10, h = 10) {
	return {
		getBoundingClientRect: () =>
			({
				left: x,
				top: y,
				right: x + w,
				bottom: y + h,
				width: w,
				height: h,
			}) as DOMRect,
	};
}

describe("reorderList", () => {
	it("moveItem moves an item forward", () => {
		expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
	});

	it("moveItem moves an item backward", () => {
		expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
	});

	it("moveItem clamps out-of-range targets", () => {
		// As far back as possible
		expect(moveItem(["a", "b"], 1, -5)).toEqual(["b", "a"]);
		// As far forward as possible
		expect(moveItem(["a", "b"], 0, 99)).toEqual(["b", "a"]);
		// Invalid source is a no-op
		expect(moveItem(["a", "b"], 99, 0)).toEqual(["a", "b"]);
		// Moving an item to its own slot keeps order stable
		expect(moveItem(["a", "b"], 0, 0)).toEqual(["a", "b"]);
	});

	it("moveItem does not mutate the source list", () => {
		const source = ["a", "b"];
		moveItem(source, 0, 1);
		expect(source).toEqual(["a", "b"]);
	});

	it("moveToSlot inserts before the original slot when moving backward", () => {
		// Dropping before original index 0 lands at final index 0
		expect(moveToSlot(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
	});

	it("moveToSlot accounts for the removal shift when moving forward", () => {
		// Dropping after original item 3 means final index 2 for a drag from 0
		expect(moveToSlot(["a", "b", "c", "d"], 0, 3)).toEqual(["b", "c", "a", "d"]);
	});

	it("slotIndex returns the slot a point falls in along an axis", () => {
		const els = [el(0, 0), el(0, 10), el(0, 20)];
		expect(slotIndex(els, "y", 4)).toBe(0);
		expect(slotIndex(els, "y", 14)).toBe(1);
		expect(slotIndex(els, "y", 24)).toBe(2);
		expect(slotIndex(els, "y", 400)).toBe(3);
	});

	it("slotIndex works horizontally", () => {
		const els = [el(0, 0), el(50, 0)];
		expect(slotIndex(els, "x", 40)).toBe(1);
	});
});
