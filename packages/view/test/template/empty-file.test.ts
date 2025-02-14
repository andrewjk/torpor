import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import { type ParseResult } from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

test("empty file", () => {
	const input = "";
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: "",
			components: [],
		},
	};
	expect(output).toEqual(expected);
});
