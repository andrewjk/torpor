import { describe, expect, it } from "vite-plus/test";
import { draggable, dropTarget, moveItem, moveToSlot, slotIndex } from "../../src/dnd/index";

describe("@torpor/ui/dnd", () => {
	it("exports the drag and drop helpers", () => {
		expect(draggable).toBeTypeOf("function");
		expect(dropTarget).toBeTypeOf("function");
		expect(moveItem).toBeTypeOf("function");
		expect(moveToSlot).toBeTypeOf("function");
		expect(slotIndex).toBeTypeOf("function");
	});
});
