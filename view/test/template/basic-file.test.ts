import { beforeAll, expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

// TODO: Preserve space

test("basic file with export default function", () => {
	const input = `export default function Test() {}`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: "export default function Test(/* @params */) {/* @start *//* @end */}",
			components: [
				{
					start: 24,
					name: "Test",
					default: true,
				},
			],
		},
	};
	expect(output).toEqual(expected);
});

test("basic file with export function", () => {
	const input = `export function Test() {}`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: "export function Test(/* @params */) {/* @start *//* @end */}",
			components: [
				{
					start: 16,
					name: "Test",
					default: false,
				},
			],
		},
	};
	expect(output).toEqual(expected);
});

test("basic file with function", () => {
	const input = `function Test() {}`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: "function Test(/* @params */) {/* @start *//* @end */}",
			components: [
				{
					start: 9,
					name: "Test",
					default: false,
				},
			],
		},
	};
	expect(output).toEqual(expected);
});

test("basic file with export default unnamed function", () => {
	const input = `export default () => {}`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: "export default (/* @params */) => {/* @start *//* @end */}",
			components: [
				{
					start: 15,
					name: "",
					default: true,
				},
			],
		},
	};
	expect(output).toEqual(expected);
});

test("basic file with const", () => {
	const input = `const Test = () => {}`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: "const Test = (/* @params */) => {/* @start *//* @end */}",
			components: [
				{
					start: 6,
					name: "Test",
					default: false,
				},
			],
		},
	};
	expect(output).toEqual(expected);
});
