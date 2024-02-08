import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ComponentParts from "../../src/types/ComponentParts";
import { control, el, text, trimParsed } from "../helpers";

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
  const expected: ComponentParts = {
    template: el(
      "section",
      [],
      [
        control("@switch", "switch (x)", [
          control("@case", "case 1:", [el("p", [], [text("It's one.")])]),
          control("@case", "case 2:", [el("p", [], [text("It's two.")])]),
        ]),
      ],
    ),
  };
  expect(output.errors).toEqual([]);
  expect(output.parts).toEqual(expected);
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
  const expected: ComponentParts = {
    template: el(
      "section",
      [],
      [
        control("@switch", "switch (x)", [
          control("@case", "case 1:", [el("p", [], [text("It's one.")])]),
          control("@default", "default:", [el("p", [], [text("It's more than one.")])]),
        ]),
      ],
    ),
  };
  expect(output.errors).toEqual([]);
  expect(output.parts).toEqual(expected);
});
