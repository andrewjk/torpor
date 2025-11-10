import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

test.skip("imports", () => {
	const input = `
import * from 'somewhere';
import * from 'somewhere-else';
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [
				{
					name: "*",
					alias: undefined,
					path: "somewhere",
					nonDefault: false,
					component: false,
				},
				{
					name: "*",
					alias: undefined,
					path: "somewhere-else",
					nonDefault: false,
					component: false,
				},
			],
			script: [{ script: input, span: { start: 0, end: input.length } }],
			components: [],
		},
	};
	expect(output).toEqual(expected);
});
