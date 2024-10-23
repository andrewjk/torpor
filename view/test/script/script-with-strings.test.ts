import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

test("script with strings", () => {
	const input = `
export default function Test() {
	const x = "\\"@render {";
	const y = '\\'@render {';
	const z = \`\\\`@render {\`;
}
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	const x = "\\"@render {";
	const y = '\\'@render {';
	const z = \`\\\`@render {\`;
	/* @end */
}
`,
			components: [{}],
		},
	};
	expect(output).toEqual(expected);
});
