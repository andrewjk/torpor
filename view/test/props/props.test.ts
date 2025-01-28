import { expect, test } from "vitest";
import parse from "../../src/compile/parse";

test("props", () => {
	const input = `
export default function Test() {
	@render {
		<p>
			Hi {$props.name}. You are {$props["age"]} years old and live at {$props['address']}.
		</p>
	}
}
`;
	const output = parse(input);
	const expected = ["name", "age", "address"];
	expect(output.template?.components[0].props).toEqual(expected);
});
