import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

test("script with comments", () => {
	const input = `
export default function Test() {
	const x = 5; // @render {
	const y = 10;
	/*
	@render {
	*/
	const z = 15;
}
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	const x = 5; // @render {
	const y = 10;
	/*
	@render {
	*/
	const z = 15;
	/* @end */
}
`,
			components: [{ start: 25, name: "Test", default: true }],
		},
	};
	expect(output).toEqual(expected);
});
