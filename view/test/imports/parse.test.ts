import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";

test("imports", () => {
  const input = `
  <script>
    import * from 'somewhere';
    import * from 'somewhere-else';

    const x = 7;
  </script>
`;
  const output = parse(input);
  const expected: ParseResult = {
    ok: true,
    errors: [],
    syntaxTree: {
      imports: [
        { name: "*", path: "somewhere", component: false },
        { name: "*", path: "somewhere-else", component: false },
      ],
      script: "const x = 7;",
    },
  };
  expect(output).toEqual(expected);
});
