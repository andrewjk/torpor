import { expect, test } from "vitest";
import type ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
import { el, root, text, trimParsed } from "../helpers";

test("one line js comments", () => {
	const input = `
<section>
  @// A comment at the top
  <p>
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
