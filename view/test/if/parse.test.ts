import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { control, el, text, trimParsed } from "../helpers";

test("if statement", () => {
  const input = `
<section>
  @if (true) {
    <p>
      Yeah, it's true
    </p>
  }
</section>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el(
        "section",
        [],
        [
          control("@if group", "", [
            control("@if", "if (true)", [el("p", [], [text("Yeah, it's true")])]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("if/else statement", () => {
  const input = `
<section>
  @if (true) {
    <p>
      Yeah, it's true
    </p>
  } else {
    <p>
      Nah, it's false
    </p>
  }
</section>
`;
  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el(
        "section",
        [],
        [
          control("@if group", "", [
            control("@if", "if (true)", [el("p", [], [text("Yeah, it's true")])]),
            control("@else", "else", [el("p", [], [text("Nah, it's false")])]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("if/else if/else statement", () => {
  const input = `
<section>
  @if (true) {
    <p>
      Yeah, it's true
    </p>
  } else if (false) {
    <p>
      Nah, it's false
    </p>
  } else {
    <p>
      It's something else
    </p>
  }
</section>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el(
        "section",
        [],
        [
          control("@if group", "", [
            control("@if", "if (true)", [el("p", [], [text("Yeah, it's true")])]),
            control("@else if", "else if (false)", [el("p", [], [text("Nah, it's false")])]),
            control("@else", "else", [el("p", [], [text("It's something else")])]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});
