import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";

// TODO: Preserve space

test("script", () => {
  const script = "const x = 5;";
  const input = `
<script>
${script}
</script>
`;
  const output = parse(input);
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      script: script.trim(),
    },
  };
  expect(output).toEqual(expected);
});
