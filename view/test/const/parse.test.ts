import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { control, el, trimParsed } from "../helpers";

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
    parts: {
      template: el("section", [], [control("@const", "const x = 5", [])]),
    },
  };
  expect(output).toEqual(expected);
});
