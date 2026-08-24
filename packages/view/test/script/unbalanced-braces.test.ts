import { expect, test } from "vite-plus/test";
import parse from "../../src/compile/parse";

test("missing closing brace at end of script", () => {
	const input = `
export default function Test() {
	@render {
		<div />
	}
`;
	const output = parse(input);
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Unbalanced braces: missing 1 closing brace");
	expect(output.errors[0].startIndex).toBe(input.length);
	expect(output.errors[0].endIndex).toBe(input.length);
	expect(output.errors[0].startLine).toBe(5);
	expect(output.errors[0].startChar).toBe(0);
});

test("missing multiple closing braces", () => {
	const input = `
export default function Test() {
	const config = {
		flag: true,
	@render {
		<div />
	}
`;
	const output = parse(input);
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Unbalanced braces: missing 2 closing braces");
});

test("unexpected closing brace", () => {
	const input = `
export default function Test() {
	@render {
		<div />
	}
}
}
`;
	const output = parse(input);
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Unexpected closing brace");
	expect(output.errors[0].startLine).toBe(6);
	expect(output.errors[0].startChar).toBe(0);
});

test("balanced braces in script parse ok", () => {
	const input = `
export default function Test() {
	const config = { open: true, chars: "{}" };
	if (config.open) {
		config.open = false;
	}
	@render {
		<div>{config.chars}</div>
	}
}
`;
	const output = parse(input);
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
});
