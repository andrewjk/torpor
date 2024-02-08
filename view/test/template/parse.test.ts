import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { control, el, text, trimParsed } from "../helpers";

// TODO: Preserve space

test("template", () => {
  const input = `
<section>
  <h2>Section heading</h2>
  <p>
    Article content.
  </p>
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
        [el("h2", [], [text("Section heading")]), el("p", [], [text("Article content.")])],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("template with control", () => {
  const input = `
<section>
  <h2>Section heading</h2>
  @if (true) {
    @if (false) {
      <p>
        @if (true) {
          <span>Article content.</span>
        }
      </p>
    }
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
          el("h2", [], [text("Section heading")]),
          control("@if group", "", [
            control("@if", "if (true)", [
              control("@if group", "", [
                control("@if", "if (false)", [
                  el(
                    "p",
                    [],
                    [
                      control("@if group", "", [
                        control("@if", "if (true)", [el("span", [], [text("Article content.")])]),
                      ]),
                    ],
                  ),
                ]),
              ]),
            ]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});
