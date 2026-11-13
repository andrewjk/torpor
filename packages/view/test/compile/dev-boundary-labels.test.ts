import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

// Dev builds emit a `t_push_dev_bound("control", ...)` call for each control
// structure, with the raw header text as the label. A header split over
// multiple lines must not put literal line terminators into the generated
// string literal (the dev client transform would fail with "Unterminated
// string"). Production builds don't emit these calls, so build with
// `dev: true` here.

function boundaryLabels(source: string): string[] {
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const { code } = build(parsed.template!, { dev: true });
	return code
		.split("\n")
		.filter((l) => l.includes('t_push_dev_bound("control"'))
		.map((l) => l.trim());
}

test("a multiline @if header compiles to a single-line dev boundary label", () => {
	const labels = boundaryLabels(`
export default function X() {
	@render {
		@if (
			true
		) { <div>Hi</div> }
	}
}
`);
	expect(labels).toEqual(['t_push_dev_bound("control", "@if ( true )");']);
});

test("a multiline @for header compiles to a single-line dev boundary label", () => {
	const labels = boundaryLabels(`
export default function X($props: { items: number[] }) {
	@render {
		@for (let item of
			$props.items
		) { <p>{item}</p> }
	}
}
`);
	expect(labels).toEqual(['t_push_dev_bound("control", "@for (let item of $props.items )");']);
});

test("a multiline first @case compiles to a single-line dev boundary label", () => {
	const labels = boundaryLabels(`
export default function X($props: { score: number }) {
	@render {
		@switch ($props.score) {
			case
				0: {
				<p>F</p>
			}
			default: {
				<p>A</p>
			}
		}
	}
}
`);
	expect(labels).toEqual(['t_push_dev_bound("control", "@case 0:");']);
});

test("single-line headers are unaffected", () => {
	const labels = boundaryLabels(`
export default function X($props: { score: number; items: number[] }) {
	@render {
		@if ($props.score > 7) {
			<p>Hi</p>
		}
		@for (let item of $props.items) {
			<p>{item}</p>
		}
		@switch ($props.score) {
			case 0: {
				<p>F</p>
			}
		}
	}
}
`);
	expect(labels).toEqual([
		't_push_dev_bound("control", "@if ($props.score > 7)");',
		't_push_dev_bound("control", "@for (let item of $props.items)");',
		't_push_dev_bound("control", "@case 0:");',
	]);
});
