import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import SyntaxTree from "../../src/types/SyntaxTree";
import { el, logic, text, trimParsed } from "../helpers";

test("switch statement", () => {
  const input = `
<section>
  @switch (x) {
    @case 1: {
      <p>It's one.</p>
    }
    @case 2: {
      <p>It's two.</p>
    }
  }
</section>
`;

  const output = trimParsed(parse(input));
  const expected: SyntaxTree = {
    template: el(
      "section",
      [],
      [
        logic("@switch", "switch (x)", [
          logic("@case", "case 1:", [el("p", [], [text("It's one.")])]),
          logic("@case", "case 2:", [el("p", [], [text("It's two.")])]),
        ]),
      ],
    ),
  };
  expect(output.errors).toEqual([]);
  expect(output.syntaxTree).toEqual(expected);
});

test("switch statement with default", () => {
  const input = `
<section>
  @switch (x) {
    @case 1: {
      <p>It's one.</p>
    }
    @default: {
      <p>It's more than one.</p>
    }
  }
</section>
`;

  const output = trimParsed(parse(input));
  const expected: SyntaxTree = {
    template: el(
      "section",
      [],
      [
        logic("@switch", "switch (x)", [
          logic("@case", "case 1:", [el("p", [], [text("It's one.")])]),
          logic("@default", "default:", [el("p", [], [text("It's more than one.")])]),
        ]),
      ],
    ),
  };
  expect(output.errors).toEqual([]);
  expect(output.syntaxTree).toEqual(expected);
});
