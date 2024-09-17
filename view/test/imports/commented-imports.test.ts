import { expect, test } from "vitest";
import ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
import { trimParsed } from "../helpers";

test("commented imports", () => {
	const input = `
  <script>
    //import * from 'somewhere';
    import * from 'somewhere-else';
  </script>
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [
				{
					name: "*",
					alias: undefined,
					path: "somewhere-else",
					nonDefault: false,
					component: false,
				},
			],
			script: "",
		},
	};
	expect(output).toEqual(expected);
});
