import { expect, test } from "vite-plus/test";
import buildClasses from "../../src/render/buildClasses";

test("buildClasses with simple string", () => {
	expect(buildClasses("foo")).toBe("foo");
});

test("buildClasses with empty string", () => {
	expect(buildClasses("")).toBe("");
});

test("buildClasses with object of truthy values", () => {
	expect(buildClasses({ foo: true, bar: true, baz: false })).toBe("foo bar");
});

test("buildClasses with array of strings", () => {
	expect(buildClasses(["foo", "bar", "baz"])).toBe("foo bar baz");
});

test("buildClasses with array of objects", () => {
	expect(buildClasses([{ foo: true }, { bar: true }])).toBe("foo bar");
});

test("buildClasses with nested array mixing strings and objects", () => {
	expect(buildClasses(["base", { active: true }, ["extra", { hidden: false }]])).toBe(
		"base active extra",
	);
});

test("buildClasses with deeply nested arrays", () => {
	expect(buildClasses([["a", ["b", ["c", ["d"]]]]])).toBe("a b c d");
});

test("buildClasses with null values in object", () => {
	expect(buildClasses({ foo: true, bar: null, baz: true })).toBe("foo baz");
});

test("buildClasses with undefined values in object", () => {
	expect(buildClasses({ foo: true, bar: undefined, baz: true })).toBe("foo baz");
});

test("buildClasses with 0 as value (falsy)", () => {
	expect(buildClasses({ foo: 0, bar: true } as any)).toBe("bar");
});

test("buildClasses with empty array", () => {
	expect(buildClasses([])).toBe("");
});

test("buildClasses with empty object", () => {
	expect(buildClasses({})).toBe("");
});

test("buildClasses with null", () => {
	expect(buildClasses(null as any)).toBe("");
});

test("buildClasses with undefined", () => {
	expect(buildClasses(undefined as any)).toBe("");
});

test("buildClasses with styleHash appends hash to string", () => {
	expect(buildClasses("foo", "s1a2b3")).toBe("foo s1a2b3");
});

test("buildClasses with styleHash appends hash to object classes", () => {
	expect(buildClasses({ foo: true, bar: false }, "s1a2b3")).toBe("foo s1a2b3");
});

test("buildClasses with styleHash appends hash to array classes", () => {
	expect(buildClasses(["foo", "bar"], "s1a2b3")).toBe("foo bar s1a2b3");
});

test("buildClasses with duplicate class names", () => {
	expect(buildClasses(["foo", "foo", "foo"])).toBe("foo foo foo");
});

test("buildClasses with empty strings in array", () => {
	expect(buildClasses(["foo", "", "bar"])).toBe("foo bar");
});

test("buildClasses with false values in array", () => {
	expect(buildClasses(["foo", false as any, "bar"])).toBe("foo bar");
});
