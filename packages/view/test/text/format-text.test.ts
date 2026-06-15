import { expect, test } from "vitest";
import formatText from "../../src/render/formatText";
import $watch from "../../src/watch/$watch";

test("formatText with string", () => {
	expect(formatText("hello")).toBe("hello");
});

test("formatText with number", () => {
	expect(formatText(42)).toBe("42");
});

test("formatText with 0", () => {
	expect(formatText(0)).toBe("0");
});

test("formatText with negative number", () => {
	expect(formatText(-5)).toBe("-5");
});

test("formatText with float", () => {
	expect(formatText(3.14)).toBe("3.14");
});

test("formatText with boolean true", () => {
	expect(formatText(true)).toBe("true");
});

test("formatText with boolean false", () => {
	expect(formatText(false)).toBe("false");
});

test("formatText with null returns empty string", () => {
	expect(formatText(null)).toBe("");
});

test("formatText with undefined returns empty string", () => {
	expect(formatText(undefined)).toBe("");
});

test("formatText with empty string", () => {
	expect(formatText("")).toBe("");
});

test("formatText with NaN", () => {
	expect(formatText(NaN)).toBe("NaN");
});

test("formatText with Infinity", () => {
	expect(formatText(Infinity)).toBe("Infinity");
});

test("formatText with object", () => {
	expect(formatText({})).toBe("[object Object]");
});

test("formatText with array", () => {
	expect(formatText([1, 2, 3])).toBe("1,2,3");
});

test("formatText with nested array", () => {
	expect(formatText([[1, 2], [3, 4]])).toBe("1,2,3,4");
});

test("formatText with symbol", () => {
	expect(formatText(Symbol("test"))).toBe("Symbol(test)");
});

test("formatText unwraps proxies", () => {
	let proxy = $watch({ value: "hello" });
	expect(formatText(proxy)).toBe("[object Object]");
});

test("formatText with BigInt", () => {
	expect(formatText(BigInt(123))).toBe("123");
});

test("formatText with special characters", () => {
	expect(formatText("<script>alert('xss')</script>")).toBe(
		"<script>alert('xss')</script>",
	);
});

test("formatText with unicode", () => {
	expect(formatText("héllo wörld")).toBe("héllo wörld");
});

test("formatText with emoji", () => {
	expect(formatText("🎉🎊🎈")).toBe("🎉🎊🎈");
});
