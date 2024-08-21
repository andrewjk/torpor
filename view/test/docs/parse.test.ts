import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/compile/types/ParseResult";
import { el, root, text, trimParsed } from "../helpers";

test("simple docs", () => {
  const input = `
  /** A header component */

  <h2>{$props.name}</h2>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      docs: {
        description: "A header component",
        props: [],
        slots: [],
      },
      markup: root([el("h2", [], [text("{$props.name}")])]),
      props: ["name"],
    },
  };
  expect(output).toEqual(expected);
});

test("prop docs", () => {
  const input = `
  /**
   * @prop {string} name - The name to show in the header
   * @prop age
   * @prop {string} username
   * The user's username
   */

  <h2>{$props.name}</h2>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      docs: {
        description: "",
        props: [
          {
            name: "name",
            type: "string",
            description: "The name to show in the header",
          },
          {
            name: "age",
            type: "",
            description: "",
          },
          {
            name: "username",
            type: "string",
            description: "The user's username",
          },
        ],
        slots: [],
      },
      markup: root([el("h2", [], [text("{$props.name}")])]),
      props: ["name"],
    },
  };
  expect(output).toEqual(expected);
});

test("slot docs", () => {
  const input = `
  /**
   * @slot
   * @sprop {string} color - The color of the header
   */

  <h2>{$props.name}</h2>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      docs: {
        description: "",
        props: [],
        slots: [
          {
            name: "",
            props: [
              {
                name: "color",
                type: "string",
                description: "The color of the header",
              },
            ],
          },
        ],
      },
      markup: root([el("h2", [], [text("{$props.name}")])]),
      props: ["name"],
    },
  };
  expect(output).toEqual(expected);
});

test("all docs", () => {
  const input = `
  /**
   * A header component
   * 
   * @prop {string} name - The name to show in the header
   * @prop {string} username
   * The user's username
   * 
   * @slot top
   * @sprop {string} color - The color of the header
   */

  <h2>{$props.name}</h2>
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      docs: {
        description: "A header component",
        props: [
          {
            name: "name",
            type: "string",
            description: "The name to show in the header",
          },
          {
            name: "username",
            type: "string",
            description: "The user's username",
          },
        ],
        slots: [
          {
            name: "top",
            props: [
              {
                name: "color",
                type: "string",
                description: "The color of the header",
              },
            ],
          },
        ],
      },
      markup: root([el("h2", [], [text("{$props.name}")])]),
      props: ["name"],
    },
  };
  expect(output).toEqual(expected);
});
