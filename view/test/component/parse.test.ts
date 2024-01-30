import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";
import { cmp, trimParsed } from "../helpers";

test("import component", () => {
  const input = `
  <script>
  import Component from './Component.tera';
  </script>
  <Component />
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      imports: [{ name: "Component", path: "./Component.tera", component: true }],
      script: "",
      template: cmp("Component", [], [], true),
    },
  };
  expect(output).toEqual(expected);
});

test("import component with props", () => {
  const input = `
  <script>
  import Component from './Component.tera';
  </script>
  <Component prop="hi" />
`;

  const output = trimParsed(parse(input));
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      imports: [{ name: "Component", path: "./Component.tera", component: true }],
      script: "",
      template: cmp(
        "Component",
        [
          {
            name: "prop",
            value: '"hi"',
          },
        ],
        [],
        true,
      ),
    },
  };
  expect(output).toEqual(expected);
});
