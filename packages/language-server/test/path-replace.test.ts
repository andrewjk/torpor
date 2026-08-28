import { describe, expect, it } from "vite-plus/test";
import pathReplace from "../src/utils/pathReplace";

describe("tsconfig path replace", () => {
	it("matches no wildcards", () => {
		expect(pathReplace("@/", "src/", "@/utils/etc")).toBe("src/utils/etc");
	});

	it("matches wildcards", () => {
		expect(pathReplace("@/*", "src/*", "@/utils/etc")).toBe("src/utils/etc");
	});
});
