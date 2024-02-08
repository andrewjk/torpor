import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { control, el, text, trimParsed } from "../helpers";

test("simple await", () => {
  const input = `
  <section>
    @await sleep() {
      <p>Loading...</p>
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
          control("@await group", "", [
            control("@await", "await sleep()", [el("p", [], [text("Loading...")])]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("await/then", () => {
  const input = `
  <section>
    @await sleep() {
      <p>Loading...</p>
    } then {
      <p>Loaded!</p>
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
          control("@await group", "", [
            control("@await", "await sleep()", [el("p", [], [text("Loading...")])]),
            control("@then", "then", [el("p", [], [text("Loaded!")])]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});

test("await/then/catch", () => {
  const input = `
  <section>
    @await sleep() {
      <p>Loading...</p>
    } then {
      <p>Loaded!</p>
    } catch {
      <p>Something went wrong.</p>
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
          control("@await group", "", [
            control("@await", "await sleep()", [el("p", [], [text("Loading...")])]),
            control("@then", "then", [el("p", [], [text("Loaded!")])]),
            control("@catch", "catch", [el("p", [], [text("Something went wrong.")])]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});
