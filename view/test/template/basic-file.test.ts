import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { el, root, trimParsed } from "../helpers";

// TODO: Preserve space

test("basic file", () => {
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
