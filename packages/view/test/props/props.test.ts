import { expect, test } from "vite-plus/test";
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

test("props -- bare $props reference", () => {
	const input = `
export default function Test() {
	let props = $props ?? {};

	@render {
		<p>
			Hi {props.name}!
		</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toEqual(["$props"]);
});
