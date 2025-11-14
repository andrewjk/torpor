import { expect, test } from "vitest";
import { build } from "../../src/compile";
import parse from "../../src/compile/parse";

test("source maps with interpolated attributes in element", () => {
	const input = `
export default function Source() {
	@render {
		<div id="{a}-{bc}-{d}"></div>
	}
}
`.trim();

	const parsed = parse(input);
	const built = build(parsed.template!, { mapped: true });

	//console.log(built.code);
	//console.log(built.map);

	const matches = built.map.filter(
		(m) => m.script === 't_attribute(t_div_1, "id", `${a}-${bc}-${d}`);',
	);
	expect(matches.length).toBe(3);

	expect(matches[0].source.start).toBe(input.indexOf("{a}") + 1);
	expect(matches[0].compiled.start).toBe(built.code.indexOf("{a}") + 1);
	expect(matches[1].source.start).toBe(input.indexOf("{bc}") + 1);
	expect(matches[1].compiled.start).toBe(built.code.indexOf("{bc}") + 1);
	expect(matches[2].source.start).toBe(input.indexOf("{d}") + 1);
	expect(matches[2].compiled.start).toBe(built.code.indexOf("{d}") + 1);
});

test("source maps with interpolated attributes in component", () => {
	const input = `
export default function Source() {
	@render {
		<Child id="{a}-{bc}-{d}" />
	}
}
`.trim();

	const parsed = parse(input);
	const built = build(parsed.template!, { mapped: true });

	//console.log(built.code);
	//console.log(built.map);

	const matches = built.map.filter((m) => m.script === "id: `${a}-${bc}-${d}`,");
	expect(matches.length).toBe(3);

	expect(matches[0].source.start).toBe(input.indexOf("{a}") + 1);
	expect(matches[0].compiled.start).toBe(built.code.indexOf("{a}") + 1);
	expect(matches[1].source.start).toBe(input.indexOf("{bc}") + 1);
	expect(matches[1].compiled.start).toBe(built.code.indexOf("{bc}") + 1);
	expect(matches[2].source.start).toBe(input.indexOf("{d}") + 1);
	expect(matches[2].compiled.start).toBe(built.code.indexOf("{d}") + 1);
});

test("source maps with interpolated text", () => {
	const input = `
export default function Source() {
	@render {
		<div>
			id={a}
			and {bc}, {d}
		</div>
	}
}
`.trim();

	const parsed = parse(input);
	const built = build(parsed.template!, { mapped: true });

	//console.log(built.code);
	//console.log(built.map);

	const matches = built.map.filter(
		(m) => m.script === "t_text_1.textContent = ` id=${t_fmt(a)} and ${t_fmt(bc)}, ${t_fmt(d)} `;",
	);
	expect(matches.length).toBe(3);

	expect(matches[0].source.start).toBe(input.indexOf("{a}") + 1);
	expect(matches[0].compiled.start).toBe(built.code.indexOf("(a)") + 1);
	expect(matches[1].source.start).toBe(input.indexOf("{bc}") + 1);
	expect(matches[1].compiled.start).toBe(built.code.indexOf("(bc)") + 1);
	expect(matches[2].source.start).toBe(input.indexOf("{d}") + 1);
	expect(matches[2].compiled.start).toBe(built.code.indexOf("(d)") + 1);
});
