import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

// TODO: Preserve space

test("script", () => {
	const script = "const x = 5;";
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
