import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/compile/types/ParseResult";

// TODO: Preserve space

test("empty file", () => {
  const input = "";
  const output = parse(input);
  const expected: ParseResult = {
    ok: true,
    errors: [],
    template: {},
  };
  expect(output).toEqual(expected);
});
