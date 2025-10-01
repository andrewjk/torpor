import { assert, expect, test } from "vitest";
import parse from "../../src/compile/parse";

test("script with strings", () => {
	const input = `
export default function Test() {
	const x = "\\"@render {";
	const y = '\\'@render {';
	const z = \`\\\`@render {\`;
}
`;
	const output = parse(input);
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	const x = "\\"@render {";
	const y = '\\'@render {';
	const z = \`\\\`@render {\`;
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
});
