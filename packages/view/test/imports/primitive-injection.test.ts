import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

test("$-primitives in strings and comments don't inject imports", () => {
	const input = `
export default function Docs() {
	const sample = "This is how you use $mount(fn) in a component";
	// A comment mentioning $peek
	@render {
		<p>{sample}</p>
	}
}
`;
	const parsed = parse(input);
	expect(parsed.ok).toBe(true);

	const client = build(parsed.template!);
	expect(client.code).not.toContain("import { $mount }");
	expect(client.code).not.toContain("import { $peek }");

	const server = build(parsed.template!, { server: true });
	expect(server.code).not.toContain("import { $mount }");
	expect(server.code).not.toContain("import { $peek }");
});

test("$-primitives in plain prose text don't inject imports", () => {
	const input = `
export default function Docs() {
	@render {
		<p>Call this from within a $mount function.</p>
	}
}
`;
	const parsed = parse(input);
	expect(parsed.ok).toBe(true);

	const client = build(parsed.template!);
	expect(client.code).not.toContain("import { $mount }");
});

test("$-primitives used in code still inject imports", () => {
	const input = `
export default function UsesMount() {
	let sample = "mentions $batch in a string";
	$mount(() => {
		sample = "";
	});
	@render {
		<p>{sample}</p>
	}
}
`;
	const parsed = parse(input);
	expect(parsed.ok).toBe(true);

	const client = build(parsed.template!);
	expect(client.code).toContain("import { $mount }");
});
