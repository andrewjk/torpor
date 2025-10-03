import { assert, expect, test } from "vitest";
import parse from "../../src/compile/parse";
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
		root([
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
	);
});
