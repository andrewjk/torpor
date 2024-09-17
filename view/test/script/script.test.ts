import { expect, test } from "vitest";
import ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
import { trimParsed } from "../helpers";

// TODO: Preserve space

test("script", () => {
	const script = "const x = 5;";
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
