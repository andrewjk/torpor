import { describe, expect, it } from "vitest";
import pathReplace from "../src/utils/pathReplace";

describe("tsconfig path replace", () => {
	it("matches no wildcards", () => {
		expect(pathReplace("@/", "src/", "@/utils/etc")).toBe("src/utils/etc");
	});

	it("matches wildcards", () => {
		expect(pathReplace("@/*", "src/*", "@/utils/etc")).toBe("src/utils/etc");
	});
});
