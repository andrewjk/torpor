import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { sp, text, trimParsed } from "../helpers";

test("simple slot", () => {
  const input = `
<:slot>
</:slot>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: sp(":slot"),
    },
  };
  expect(output).toEqual(expected);
});

test("slot with a name", () => {
  const input = `
<:slot name="header">
</:slot>
`;
  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: sp(":slot", [{ name: "name", value: '"header"' }]),
    },
  };
  expect(output).toEqual(expected);
});

test("slot with default content", () => {
  const input = `
<:slot>
  Nothing here
</:slot>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: sp(":slot", [], [text("Nothing here")]),
    },
  };
  expect(output).toEqual(expected);
});
