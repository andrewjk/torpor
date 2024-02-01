import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { el, logic, text, trimParsed } from "../helpers";

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
          logic("@await group", "", [
            logic("@await", "await sleep()", [el("p", [], [text("Loading...")])]),
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
          logic("@await group", "", [
            logic("@await", "await sleep()", [el("p", [], [text("Loading...")])]),
            logic("@then", "then", [el("p", [], [text("Loaded!")])]),
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
          logic("@await group", "", [
            logic("@await", "await sleep()", [el("p", [], [text("Loading...")])]),
            logic("@then", "then", [el("p", [], [text("Loaded!")])]),
            logic("@catch", "catch", [el("p", [], [text("Something went wrong.")])]),
          ]),
        ],
      ),
    },
  };
  expect(output).toEqual(expected);
});
