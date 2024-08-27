import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

test("commented imports", () => {
	const input = `
  <script>
    //import * from 'somewhere';
    import * from 'somewhere-else';
  </script>
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [{ name: "*", path: "somewhere-else", component: false }],
			script: "const x = 7;",
		},
	};
	expect(output).toEqual(expected);
});
