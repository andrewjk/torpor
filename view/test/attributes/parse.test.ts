import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { att, el, logic, text, trimParsed } from "../helpers";

test("attribute with double quotes", () => {
  const input = `
<a href="http://example.com">
  Link
</a>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el("a", [att("href", '"http://example.com"')], [text("Link")]),
    },
  };
  expect(output).toEqual(expected);
});

test("attribute with single quotes", () => {
  const input = `
<a href='http://example.com'>
  Link
</a>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el("a", [att("href", "'http://example.com'")], [text("Link")]),
    },
  };
  expect(output).toEqual(expected);
});

test("attribute with no quotes", () => {
  const input = `
<a href=http://example.com>
  Link
</a>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el("a", [att("href", "http://example.com")], [text("Link")]),
    },
  };
  expect(output).toEqual(expected);
});

test("multiple attributes", () => {
  const input = `
<a href1="http://example.com" href2='http://example.com' href3=http://example.com>
  Link
</a>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el(
        "a",
        [
          att("href1", '"http://example.com"'),
          att("href2", "'http://example.com'"),
          att("href3", "http://example.com"),
        ],
        [text("Link")],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("event attribute with name", () => {
  const input = `
<button onclick={increment}>
  Increment
</button>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el("button", [att("onclick", "{increment}")], [text("Increment")]),
    },
  };
  expect(output).toEqual(expected);
});

test("event attribute with code", () => {
  const input = `
<button onclick={() => {
  increment();
}}>
  Increment
</button>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: el("button", [att("onclick", "{() => {\n  increment();\n}}")], [text("Increment")]),
    },
  };
  expect(output).toEqual(expected);
});
