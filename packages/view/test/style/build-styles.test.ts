import { expect, test } from "vite-plus/test";
import buildStyles from "../../src/render/buildStyles";

test("buildStyles with string", () => {
	expect(buildStyles("color: red")).toBe("color: red");
});

test("buildStyles with empty string", () => {
	expect(buildStyles("")).toBe("");
});

test("buildStyles with simple object", () => {
	expect(buildStyles({ color: "red", background: "blue" })).toBe("color: red; background: blue");
});

test("buildStyles converts camelCase to kebab-case", () => {
	expect(buildStyles({ backgroundColor: "red", fontSize: "12px" })).toBe(
		"background-color: red; font-size: 12px",
	);
});

test("buildStyles with WebkitPrefix", () => {
	expect(buildStyles({ WebkitTransition: "all 1s" })).toBe("webkit-transition: all 1s");
});

test("buildStyles with MozPrefix", () => {
	expect(buildStyles({ MozTransform: "scale(2)" })).toBe("moz-transform: scale(2)");
});

// BUG: buildStyles does not filter out null/undefined values in objects
// These should be excluded but currently produce "background: null" / "background: undefined"
test("buildStyles with null values in object (BUG: null not filtered)", () => {
	expect(buildStyles({ color: "red", background: null as any })).toBe("color: red");
});

test("buildStyles with undefined values in object (BUG: undefined not filtered)", () => {
	expect(buildStyles({ color: "red", background: undefined as any })).toBe("color: red");
});

test("buildStyles with empty object", () => {
	expect(buildStyles({})).toBe("");
});

test("buildStyles with null", () => {
	expect(buildStyles(null as any)).toBe("");
});

test("buildStyles with undefined", () => {
	expect(buildStyles(undefined as any)).toBe("");
});

test("buildStyles with array of objects", () => {
	expect(buildStyles([{ color: "red" }, { fontSize: "12px" }])).toBe("color: red; font-size: 12px");
});

test("buildStyles with nested arrays", () => {
	expect(buildStyles([{ color: "red" }, [{ fontSize: "12px" }]])).toBe(
		"color: red; font-size: 12px",
	);
});

test("buildStyles with array of strings", () => {
	expect(buildStyles(["color: red", "font-size: 12px"])).toBe("color: red; font-size: 12px");
});

test("buildStyles with empty array", () => {
	expect(buildStyles([])).toBe("");
});

test("buildStyles with ms prefix (lowercase)", () => {
	expect(buildStyles({ msTransform: "rotate(5deg)" })).toBe("ms-transform: rotate(5deg)");
});

test("buildStyles with multiple consecutive capitals", () => {
	expect(buildStyles({ borderTopLeftRadius: "5px" })).toBe("border-top-left-radius: 5px");
});
