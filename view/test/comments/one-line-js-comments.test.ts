import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { el, text, trimParsed } from "../helpers";

test("one line js comments", () => {
  const input = `
<section>
  @// A comment at the top
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
      template: el("section", [], [el("p", [], [text("The content")])]),
    },
  };
  expect(output).toEqual(expected);
});
