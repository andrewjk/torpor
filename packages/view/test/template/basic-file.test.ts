import { assert, expect, test } from "vitest";
import parse from "../../src/compile/parse";

// TODO: Preserve space

test("basic file with export default function", () => {
	const input = `export default function Test() {}`;
	const output = parse(input);
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(
		"export default function Test(/* @params */): void {/* @start *//* @end */}",
	);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(24);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
});

test("basic file with export function", () => {
	const input = `export function Test() {}`;
	const output = parse(input);
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(
		"export function Test(/* @params */): void {/* @start *//* @end */}",
	);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(16);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(false);
});

test("basic file with function", () => {
	const input = `function Test() {}`;
	const output = parse(input);
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(
		"function Test(/* @params */): void {/* @start *//* @end */}",
	);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(9);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(false);
});

test("basic file with export default unnamed function", () => {
	const input = `export default () => {}`;
	const output = parse(input);
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(
		"export default (/* @params */) => {/* @start *//* @end */}",
	);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(15);
	expect(output.template.components[0].name).toBe("");
	expect(output.template.components[0].default).toBe(true);
});

test("basic file with const", () => {
	const input = `const Test = () => {}`;
	const output = parse(input);
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(
		"const Test = (/* @params */) => {/* @start *//* @end */}",
	);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(6);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(false);
});
