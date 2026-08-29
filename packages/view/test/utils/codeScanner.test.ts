import { expect, test } from "vite-plus/test";
import { codeRanges, skipStringOrComment } from "../../src/compile/utils/codeScanner";

function codes(value: string): string[] {
	return codeRanges(value).map(([start, end]) => value.substring(start, end));
}

function rest(value: string, start: number): string {
	expect(skipStringOrComment(value, start), `no skip at ${start}`).not.toBe(-1);
	return value.substring(start, skipStringOrComment(value, start));
}

test("returns -1 for plain code characters", () => {
	expect(skipStringOrComment(`a + b`, 2)).toBe(-1);
	expect(skipStringOrComment(`a / b`, 2)).toBe(-1);
	expect(skipStringOrComment(`x /= 2`, 2)).toBe(-1);
});

test("single and double quoted strings, with escapes", () => {
	expect(rest(`'it\\'s' + x`, 0)).toBe(`'it\\'s'`);
	expect(rest(`"a\\"b" + x`, 0)).toBe(`"a\\"b"`);
});

test("template strings, including interpolations and escapes", () => {
	expect(rest("`abc` + x", 0)).toBe("`abc`");
	expect(rest("`a${b}c` + x", 0)).toBe("`a${b}c`");
	expect(rest("`a\\`b` + x", 0)).toBe("`a\\`b`");
	// An escaped backslash before a backtick does not escape the backtick
	expect(rest("`a\\\\` + x", 0)).toBe("`a\\\\`");
	// Nested templates inside interpolations
	expect(rest("`a${ `b${c}` }d` + x", 0)).toBe("`a${ `b${c}` }d`");
});

test("line comments end at the newline, or the end of the value", () => {
	expect(rest("x; // doesn't stop here\ny", 3)).toBe("// doesn't stop here");
	expect(rest("x; // unterminated", 3)).toBe("// unterminated");
});

test("block comments", () => {
	expect(rest("x; /* a // comment */ y", 3)).toBe("/* a // comment */");
	expect(rest("x; /* unterminated", 3)).toBe("/* unterminated");
});

test("regex literals", () => {
	expect(rest("x.replace(/a/gi, b)", 10)).toBe("/a/gi");
	expect(rest("/[a/b]/.test(x)", 0)).toBe("/[a/b]/");
	expect(rest("/a\\/b/.test(x)", 0)).toBe("/a\\/b/");
	// After keywords that can be followed by an expression
	expect(rest("return /a/;", 7)).toBe("/a/");
	expect(rest("typeof /a/;", 7)).toBe("/a/");
	// At the start of an expression
	expect(rest("/a/.test(x)", 0)).toBe("/a/");
	// After an operator
	expect(rest("x + /a/.source", 4)).toBe("/a/");
});

test("division is not a regex literal", () => {
	expect(skipStringOrComment("a / b", 2)).toBe(-1);
	expect(skipStringOrComment("a++ / 2", 4)).toBe(-1);
	expect(skipStringOrComment("(a + b) / 2", 8)).toBe(-1);
	expect(skipStringOrComment("arr[0] / 2", 7)).toBe(-1);
});

test("plain code is one range", () => {
	expect(codes("a + b.c")).toEqual(["a + b.c"]);
});

test("string contents are excluded", () => {
	expect(codes(`x = 'a + b' + c`)).toEqual(["x = ", " + c"]);
});

test("template text is excluded, interpolation code is kept", () => {
	expect(codes("`a${b}c`")).toEqual(["b"]);
	expect(codes("`Go to ${slide.index + 1}`")).toEqual(["slide.index + 1"]);
});

test("the TagInput case: an apostrophe in a comment doesn't swallow code", () => {
	const value = [
		"(e: MouseEvent) => {",
		"\t// The field doesn't blur first",
		"\te.preventDefault();",
		"\tpickSuggestion(item);",
		"}",
	].join("\n");
	const joined = codes(value).join("");
	expect(joined).toContain("pickSuggestion(item);");
});

test("regex literal contents are excluded", () => {
	expect(codes("x.replace(/item/g, y)")).toEqual(["x.replace(", ", y)"]);
	expect(codes("const r = /a[/]b/")).toEqual(["const r = "]);
});

test("comments are excluded", () => {
	expect(codes("a /* b + c */ + d // e + f")).toEqual(["a ", " + d "]);
});

test("nested structures stay in sync", () => {
	const value = "`a${ { b: `x${y}` }.b }d` + item";
	expect(codes(value).join("")).toContain("+ item");
});
