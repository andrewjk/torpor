import { expect, test } from "vitest";
import ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
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
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: script.trim(),
		},
	};
	expect(output).toEqual(expected);
});
