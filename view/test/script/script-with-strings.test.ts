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
			script: `
export default function Test(/* @params */) {
	const x = "\\"@render {";
	const y = '\\'@render {';
	const z = \`\\\`@render {\`;
}
`,
		},
	};
	expect(output).toEqual(expected);
});
