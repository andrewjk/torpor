import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/compile/types/ParseResult";
import { el, root, text, trimParsed } from "../helpers";

test("multi line js comments", () => {
  const input = `
<section>
  @/*
    A comment at the top
    with multiple lines
   */
  <p>
    The content
  </p>
</section>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      markup: root([el("section", [], [el("p", [], [text("The content")])])]),
    },
  };
  expect(output).toEqual(expected);
});
