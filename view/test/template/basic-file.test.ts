import { expect, test } from "vitest";
import ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
import { el, root, trimParsed } from "../helpers";

// TODO: Preserve space

test("basic file", () => {
	const input = `<script/><div/><style/>`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("div", undefined, undefined, true)]),
		},
	};
	expect(output).toEqual(expected);
});
