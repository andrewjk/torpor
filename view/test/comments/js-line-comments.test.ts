import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { el, root, text, trimParsed } from "../helpers";

test("js line comments", () => {
	const input = `
@// A comment outside
<section>
  @// A comment at the top
  <p>
    @// A comment in text
    The content
  </p>
</section>
`;

	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("section", [], [el("p", [], [text("The content")])])]),
		},
	};
	expect(output).toEqual(expected);
});
