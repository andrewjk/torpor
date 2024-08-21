import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { el, root } from "../helpers";

// TODO: Preserve space

test("basic file", () => {
  const input = `<script/><div/><style/>`;
  const output = parse(input);
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: root([el("div", undefined, undefined, true)]),
    },
  };
  expect(output).toEqual(expected);
});
