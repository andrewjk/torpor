import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

// TODO: Preserve space

test("script with strings", () => {
	const script = `
const x = "\\"</script>";
const y = '\\'</script>';
const z = \`\\\`</script>\`;
`;
	const input = `
<script>
${script}
</script>
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: script.trim(),
		},
	};
	expect(output).toEqual(expected);
});
