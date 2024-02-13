import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";

// TODO: Preserve space

test("empty file", () => {
  const input = "";
  const output = parse(input);
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {},
  };
  expect(output).toEqual(expected);
});
