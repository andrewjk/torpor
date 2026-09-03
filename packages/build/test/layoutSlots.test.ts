import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { findMissingSlotLayout, warnMissingSlotContent } from "../src/site/layoutSlots";

const layouts = [{ path: "/_layout" }, { path: "/docs/_layout" }, { path: "/docs/ui/_layout" }];

describe("findMissingSlotLayout", () => {
	test("returns undefined when every slot level rendered", () => {
		expect(findMissingSlotLayout(layouts, new Set([1, 2, 3]))).toBeUndefined();
	});

	test("returns undefined when there are no layouts", () => {
		expect(findMissingSlotLayout([], new Set())).toBeUndefined();
	});

	test("identifies the root layout when its slot never rendered", () => {
		// Level 1 is the root layout's slot: nothing ran
		expect(findMissingSlotLayout(layouts, new Set())).toBe("/_layout");
	});

	test("identifies the outermost broken layout in the chain", () => {
		// Level 1 ran (root rendered its slot) but level 2 didn't, so the
		// deeper levels are unreachable and the docs layout is the offender
		expect(findMissingSlotLayout(layouts, new Set([1]))).toBe("/docs/_layout");
	});

	test("identifies the innermost layout when only deeper levels ran", () => {
		expect(findMissingSlotLayout(layouts, new Set([1, 2]))).toBe("/docs/ui/_layout");
	});
});

describe("warnMissingSlotContent", () => {
	const warnings: string[][] = [];
	const warn = vi.spyOn(console, "warn").mockImplementation((...args: string[]) => {
		warnings.push(args);
	});

	afterEach(() => {
		warnings.length = 0;
		warn.mockClear();
	});

	test("warns once per layout path", () => {
		warnMissingSlotContent("/some/_layout");
		warnMissingSlotContent("/some/_layout");
		warnMissingSlotContent("/other/_layout");

		expect(warn).toHaveBeenCalledTimes(2);
		expect(warnings[0][0]).toContain("/some/_layout");
		expect(warnings[0][0]).toContain("<slot />");
		expect(warnings[1][0]).toContain("/other/_layout");
	});
});
