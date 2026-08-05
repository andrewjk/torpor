import { expect, test } from "vite-plus/test";
import formatAttributeText from "../../src/render/formatAttributeText";

test("formatAttributeText with string", () => {
	expect(formatAttributeText("hello")).toBe("hello");
});

test("formatAttributeText with empty string", () => {
	expect(formatAttributeText("")).toBe("");
});

test("formatAttributeText with number", () => {
	expect(formatAttributeText(42)).toBe("42");
});

test("formatAttributeText with null returns empty string", () => {
	expect(formatAttributeText(null)).toBe("");
});

test("formatAttributeText with undefined returns empty string", () => {
	expect(formatAttributeText(undefined)).toBe("");
});

test("formatAttributeText escapes double quotes", () => {
	expect(formatAttributeText('say "hello"')).toBe("say &quot;hello&quot;");
});

test("formatAttributeText does not escape single quotes", () => {
	expect(formatAttributeText("it's")).toBe("it's");
});

test("formatAttributeText does not escape angle brackets", () => {
	expect(formatAttributeText("<div>")).toBe("<div>");
});

test("formatAttributeText does not escape ampersand", () => {
	expect(formatAttributeText("a & b")).toBe("a & b");
});

test("formatAttributeText with 0", () => {
	expect(formatAttributeText(0)).toBe("0");
});

test("formatAttributeText with boolean true", () => {
	expect(formatAttributeText(true)).toBe("true");
});

test("formatAttributeText with boolean false", () => {
	expect(formatAttributeText(false)).toBe("false");
});

test("formatAttributeText with multiple quotes", () => {
	expect(formatAttributeText('"a" and "b"')).toBe("&quot;a&quot; and &quot;b&quot;");
});

test("formatAttributeText with quote in URL", () => {
	expect(formatAttributeText('javascript:void("test")')).toBe("javascript:void(&quot;test&quot;)");
});
