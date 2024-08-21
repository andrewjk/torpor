import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/compile/types/ParseResult";

// TODO: Preserve space

test("script with strings", () => {
  const script = `
const x = "\\"</script>";
const y = '\\'</script>';
const z = \`\\\`</script>\`;
`;
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
