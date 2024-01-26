import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { el, logic, text, trimParsed } from "../helpers";

test("for i loop", () => {
  const input = `
<section>
  @for (let i = 0; i < 5; i++) {
    <p>
      {i}
    </p>
  }
</section>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      template: el(
        "section",
        [],
        [logic("@for", "for (let i = 0; i < 5; i++)", [el("p", [], [text("{i}")])])],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("for/of statement", () => {
  const input = `
<section>
  @for (let item of things) {
    <p>
      {item.name}
    </p>
  }
</section>
`;
  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      template: el(
        "section",
        [],
        [logic("@for", "for (let item of things)", [el("p", [], [text("{item.name}")])])],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("for/in statement", () => {
  const input = `
<section>
  @for (let prop in thing) {
    <p>
      {thing[prop]}
    </p>
  }
</section>
`;
  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      template: el(
        "section",
        [],
        [logic("@for", "for (let prop in thing)", [el("p", [], [text("{thing[prop]}")])])],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("for statement with key", () => {
  const input = `
<section>
  @for (let item of things) {
    @key = item.id
    <p>
      {item.name}
    </p>
  }
</section>
`;
  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      template: el(
        "section",
        [],
        [
          logic("@for", "for (let item of things)", [
            logic("@key", "key = item.id"),
            el("p", [], [text("{item.name}")]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});
