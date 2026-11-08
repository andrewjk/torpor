import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

test("warns when a template expression reads a plain let initialized from $props", () => {
	const source = `
export default function Prefix($props: { i: number }) {
	let prefix = \`children[\${$props.i}]\`;

	@render {
		<p>{prefix}</p>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: false, source });
	expect(built.errors).toEqual([]);
	expect(built.warnings.length).toBe(1);
	expect(built.warnings[0]!.message).toContain("'prefix'");
	expect(built.warnings[0]!.message).toContain("$props");
});

test("no warning when the let is read only from script, not markup", () => {
	const source = `
export default function OnlyScript($props: { i: number }) {
	let prefix = \`children[\${$props.i}]\`;

	@function label() {
		return prefix;
	}

	@render {
		<p>Static</p>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: false, source });
	expect(built.errors).toEqual([]);
	expect(built.warnings).toEqual([]);
});

test("no warning when the let doesn't read $props", () => {
	const source = `
export default function LocalOnly($props: { i: number }) {
	let count = 1 + 2;

	@render {
		<p>{count}</p>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: false, source });
	expect(built.errors).toEqual([]);
	expect(built.warnings).toEqual([]);
});

test("no warning from let declarations inside strings or comments", () => {
	const source = `
export default function NoFalsePositives($props: { i: number }) {
	const text = "let fake = $props.i";
	// let commented = $props.i;

	@render {
		<p>{text}</p>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: false, source });
	expect(built.errors).toEqual([]);
	expect(built.warnings).toEqual([]);
});

test("server build produces no warnings (client-side concern)", () => {
	const source = `
export default function Prefix($props: { i: number }) {
	let prefix = \`children[\${$props.i}]\`;

	@render {
		<p>{prefix}</p>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: true, source });
	expect(built.warnings).toEqual([]);
});
