import { expect, test } from "vitest";
import ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
import { el, root, text, trimParsed } from "../helpers";

test("html comments", () => {
	const input = `
<!-- A comment at the top -->
<section>
  <!-- A comment inside -->
  <p>
    The <!-- A comment inside some text --> content
  </p>
</section>
`;

	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("section", [], [el("p", [], [text("The  content")])])]),
		},
	};
	expect(output).toEqual(expected);
});
