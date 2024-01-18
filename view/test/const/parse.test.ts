import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { el, logic, trimParsed } from "../helpers";

test("simple constant", () => {
  const input = `
  <section>
    @const x = 5
  </section>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      template: el("section", [], [logic("@const", "const x = 5", [])]),
    },
  };
  expect(output).toEqual(expected);
});
