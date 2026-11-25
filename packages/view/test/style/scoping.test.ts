import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

function compile(source: string) {
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);
	return build(parsed.template!);
}

test("scoped styles mark every element in the component", () => {
	const source = `
export default function Test() {
	@render {
		<div>
			<p>one</p>
			<span>two</span>
		</div>
	}

	@style {
		p:hover { color: blue; }
	}
}
`;

	const result = compile(source);
	const hash = result.styles[0].hash;
	const fragment = result.code.split("\n").find((line) => line.includes("t_fragment_0 ="))!;

	// Selector matching is no longer used to decide what to mark: every element
	// in the component gets the scope class, so compound/pseudo/attribute
	// selectors can't silently fail to apply.
	expect(fragment).toContain(`<div class="torp-${hash}">`);
	expect(fragment).toContain(`<p class="torp-${hash}">`);
	expect(fragment).toContain(`<span class="torp-${hash}">`);
});

test("selector shapes are scoped without mangling brackets or pseudo arguments", () => {
	const source = `
export default function Test() {
	@render {
		<div class="a b" data-x="a b">
			<span class="c">one</span>
		</div>
	}

	@style {
		p:hover { color: blue; }
		.a.b { color: green; }
		[data-x="a b"] { color: red; }
		:is(.a, .b) { color: purple; }
		@media (min-width: 1px) {
			p { color: orange; }
		}
		:global(p) { color: black; }
	}
}
`;

	const result = compile(source);
	const hash = result.styles[0].hash;
	const css = result.styles[0].style;

	expect(css).toContain(`p.torp-${hash}:hover`);
	expect(css).toContain(`.a.b.torp-${hash}`);
	expect(css).toContain(`[data-x="a b"].torp-${hash}`);
	expect(css).toContain(`.torp-${hash}:is(.a, .b)`);
	expect(css).toContain(`p.torp-${hash}`);
	expect(css).toContain(`p {\n\tcolor: black;`);
});

test("keyframe steps are not treated as selectors", () => {
	const source = `
export default function Test() {
	@render {
		<p>one</p>
	}

	@style {
		@keyframes spin {
			from { opacity: 0; }
			to { opacity: 1; }
		}
	}
}
`;

	const css = compile(source).styles[0].style;

	expect(css).toContain("from {");
	expect(css).toContain("to {");
	expect(css).not.toContain("from.torp-");
	expect(css).not.toContain("to.torp-");
});
