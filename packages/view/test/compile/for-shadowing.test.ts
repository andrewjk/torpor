import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

test("a write in a shadowing inner loop is reported once, against the inner binding", () => {
	// `item` is reassigned inside the INNER loop, which redeclares the name —
	// the inner binding shadows the outer one, so the outer loop's scan must
	// not report it (the inner loop's own scan does, once)
	const source = `
export default function Nested($props: { outer: { id: number }[]; inner: { id: number }[] }) {
	@render {
		@for (let item of $props.outer) {
			<h>{item.id}</h>
			@for (let item of $props.inner) {
				<p>{item.id}</p>
				<button onclick={() => item = { id: 1 }}>x</button>
			}
		}
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: false, source });
	const loopErrors = built.errors.filter((e) =>
		e.message.includes("Cannot assign to loop variable"),
	);
	expect(loopErrors.length).toBe(1);
});

test("a write in a non-shadowing inner loop is still reported against the outer binding", () => {
	// The inner loop uses a different name, so a write to the OUTER `item`
	// beneath it belongs to the outer binding and must be reported
	const source = `
export default function Nested($props: { outer: { id: number }[]; inner: { id: number }[] }) {
	@render {
		@for (let item of $props.outer) {
			@for (let sub of $props.inner) {
				<button onclick={() => item = { id: 1 }}>x</button>
			}
		}
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: false, source });
	const loopErrors = built.errors.filter((e) =>
		e.message.includes('Cannot assign to loop variable "item"'),
	);
	expect(loopErrors.length).toBe(1);
});

test("a C-style inner loop header's init/update doesn't flag the outer loop's variable", () => {
	// The inner loop redeclares `i` C-style; its header's `i = 0` and `i++`
	// belong to the inner binding and used to be misattributed to the outer
	// `i` (the scanner pushed nested @for statements verbatim)
	const source = `
export default function Nested($props: { rows: string[][] }) {
	@render {
		@for (let i of $props.rows) {
			<h>{i.length}</h>
			@for (let i = 0; i < 3; i++) {
				<p>cell {i}</p>
			}
		}
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const built = build(parsed.template!, { server: false, source });
	const loopErrors = built.errors.filter((e) =>
		e.message.includes("Cannot assign to loop variable"),
	);
	expect(loopErrors).toEqual([]);
});
