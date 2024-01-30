import { expect, test } from "vitest";
import parse from "../../src/compile/parse";

test("multiple top-level elements", () => {
  const input = `
<div/>
<div/>
  `;
  const output = parse(input);
  const expected = {
    ok: false,
    errors: [
      {
        message: "Multiple top-level elements: div",
        start: 8,
      },
    ],
  };
  expect(output).toEqual(expected);
});
