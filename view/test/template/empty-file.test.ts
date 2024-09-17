import { expect, test } from "vitest";
import ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
import { trimParsed } from "../helpers";

// TODO: Preserve space

test("empty file", () => {
	const input = "";
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {},
	};
	expect(output).toEqual(expected);
});
