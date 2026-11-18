import { describe, expect, it } from "vite-plus/test";
import { createItemLoader, normalizeLoadResult } from "../../src/loader/index";

describe("@torpor/ui/loader", () => {
	it("exports the loader helpers", () => {
		expect(createItemLoader).toBeTypeOf("function");
		expect(normalizeLoadResult).toBeTypeOf("function");
	});

	it("normalizes a bare array into a load result", () => {
		expect(normalizeLoadResult(["a"])).toEqual({ items: ["a"] });
	});
});
