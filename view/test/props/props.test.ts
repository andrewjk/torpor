import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";

// TODO: Preserve space

test("props", () => {
	const input = `
<p>
  Hi {$props.name}. You are {$props["age"]} years old and live at {$props['address']}.
</p>
`;
	const output = parse("x", input);
	const expected = ["name", "age", "address"];
	expect(output.template?.props).toEqual(expected);
});
