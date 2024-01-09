import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";

test("style", () => {
  const input = `
<style>
.h1 { color: blue; }
</style>
`;
  const output = parse(input);
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      style: ".h1 { color: blue; }",
    },
  };
  expect(output).toEqual(expected);
});
