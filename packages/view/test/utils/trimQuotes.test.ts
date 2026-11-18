import { describe, expect, test } from "vite-plus/test";
import trimQuotes from "../../src/compile/utils/trimQuotes";

describe("trimQuotes", () => {
	test("trims matching double quotes", () => {
		expect(trimQuotes('"x.png"')).toBe("x.png");
	});

	test("trims matching single quotes", () => {
		expect(trimQuotes("'x.png'")).toBe("x.png");
	});

	test("trims matching backticks", () => {
		expect(trimQuotes("`x.png`")).toBe("x.png");
	});

	test("leaves non-matching quotes alone", () => {
		expect(trimQuotes('"x.png')).toBe('"x.png');
		expect(trimQuotes("'x.png\"")).toBe("'x.png\"");
	});

	test("leaves interior quotes alone", () => {
		expect(trimQuotes('"say "hello""')).toBe('say "hello"');
	});

	test("trims an empty quoted value to an empty string", () => {
		// Regression: a value of `""` used to over-trim, and `substring`'s
		// argument swapping handed back the original untrimmed text
		expect(trimQuotes('""')).toBe("");
		expect(trimQuotes("''")).toBe("");
		expect(trimQuotes("``")).toBe("");
	});
});
