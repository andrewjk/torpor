import { assert, expect, test } from "vitest";
import { build } from "../../src/compile";
import parse from "../../src/compile/parse";

test("source maps", () => {
	const input = `
export default function Source($props: { counter: number }) {
const x = 5;

	@render {
		@if ($props.counter > 10) {
			<p>
				It's large.
			</p>
		} else {
			<p>
				It's small.
			</p>
		}
	}

const y = 10;
}
`;
	const parsed = parse(input);
	const built = build(parsed.template!, { mapped: true });

	//console.log(built.code);
	//console.log(built.map);

	const index1 = input.indexOf("export default function Source") - 1; // there's a newline before it
	const map1 = built.map.find((m) => m.source.start == index1);
	assert(map1);
	expect(map1.compiled.start).toBe(built.code.indexOf("export default function Source") - 1);

	let index2 = input.indexOf("const x");
	const map2 = built.map.find((m) => m.source.start == index2);
	assert(map2);
	expect(map2.compiled.start).toBe(built.code.indexOf("const x"));

	//console.log("Y INDEX", input.indexOf("const y"));
	let index3 = input.indexOf("const y") - 2; // there's 2 newlines
	const map3 = built.map.find((m) => m.source.start == index3);
	assert(map3);
	expect(map3.compiled.start).toBe(built.code.indexOf("const y") - 2);
});

/*
function getLineAndCharAtIndex(source: string, index: number) {
	let line = 0;
	let char = 0;
	for (let i = 0; i < index; i++) {
		if (source[i] === "\n") {
			line++;
			char = 0;
		} else {
			char++;
		}
	}
	return { line, char };
}
*/
