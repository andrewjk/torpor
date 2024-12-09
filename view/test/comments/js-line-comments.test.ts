import { beforeAll, expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { el, root, text, trimParsed } from "../helpers";

test("js line comments", () => {
	const input = `
export default function Test() {
	@render {
		@// A comment outside
		<section>
		@// A comment at the top
		<p>
			@// A comment in text
			The content
		</p>
		</section>
	}
}
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("section", [], [el("p", [], [text("The content")])])]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
});
