import { expect, test } from "vite-plus/test";
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

test("unclosed template literal attribute", () => {
	const input = `
export default function Test() {
	@render {
		<a title=\`hello />
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(false);
	expect(output.errors.map((error) => error.message)).toContain(
		"Unclosed template literal in attribute",
	);
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
