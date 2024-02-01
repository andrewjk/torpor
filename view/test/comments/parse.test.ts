import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { el, text, trimParsed } from "../helpers";

test("html comments", () => {
  const input = `
<!-- A comment at the top -->
<section>
  <!-- A comment inside -->
  <p>
    The <!-- A comment inside some text --> content
  </p>
</section>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el("section", [], [el("p", [], [text("The"), text("content")])]),
    },
  };
  expect(output).toEqual(expected);
});

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
      template: el("section", [], [el("p", [], [text("The content")])]),
    },
  };
  expect(output).toEqual(expected);
});
