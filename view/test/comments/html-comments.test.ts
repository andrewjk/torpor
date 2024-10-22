import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { el, root, text, trimParsed } from "../helpers";

test("html comments", () => {
	const input = `
export default function Test() {
	@render {
		<!-- A comment at the top -->
		<section>
		<!-- A comment inside -->
		<p>
			The <!-- A comment inside some text --> content
		</p>
		</section>
	}
}
`;

	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
}
`,
			markup: root([el("section", [], [el("p", [], [text("The  content")])])]),
		},
	};
	expect(output).toEqual(expected);
});
