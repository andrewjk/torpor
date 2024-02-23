import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";

// TODO: Preserve space

test("props", () => {
  const input = `
<p>
  Hi {$props.name}. You are {$props["age"]} years old and live at {$props['address']}.
</p>
`;
  const output = parse(input);
  const expected = ["name", "age", "address"];
  expect(output.parts?.props).toEqual(expected);
});
