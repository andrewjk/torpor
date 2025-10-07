import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import { trimParsed } from "../helpers";

test("unfinished tag", () => {
	const input = `
export default function Test() {
	@render {
		<div>
			<a
		</div>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Unclosed non-void element: a");
});

test("unfinished tag with attribute", () => {
	const input = `
export default function Test() {
	@render {
		<div>
			<a b
		</div>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Unclosed non-void element: a");
});
