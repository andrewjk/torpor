import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { control, el, root, text, trimParsed } from "../helpers";

test("for statement with key", () => {
	const input = `
export default function Test() {
	@render {
		<section>
			@for (let item of things) {
				key = item.id
				<p>
					{item.name}
				</p>
			}
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
					markup: root([
						el(
							"section",
							[],
							[
								control("@for group", "", [
									control("@for", "for (let item of things)", [
										control("@key", "key = item.id"),
										el("p", [], [text("{item.name}")]),
									]),
								]),
							],
						),
					]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
});
