import { assert, expect, test } from "vitest";
import parse from "../../src/compile/parse";
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

	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */): void {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("section", [], [el("p", [], [text("The  content")])])]),
	);
});
