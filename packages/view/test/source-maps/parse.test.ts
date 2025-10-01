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
	const map1 = built.map.find((m) => m.source.startIndex == index1);
	assert(map1);
	expect(map1.source.startLine).toBe(0);
	expect(map1.source.startChar).toBe(0);
	let expectedSource1 = getLineAndCharAtIndex(input, map1.source.startIndex);
	expect(map1.source.startLine).toBe(expectedSource1.line);
	expect(map1.source.startChar).toBe(expectedSource1.char);
	expect(map1.compiled.startIndex).toBe(built.code.indexOf("export default function Source") - 1);
	let expectedCompiled1 = getLineAndCharAtIndex(built.code, map1.compiled.startIndex);
	expect(map1.compiled.startLine).toBe(expectedCompiled1.line);
	expect(map1.compiled.startChar).toBe(expectedCompiled1.char);

	let index2 = input.indexOf("const x");
	const map2 = built.map.find((m) => m.source.startIndex == index2);
	assert(map2);
	let expectedSource2 = getLineAndCharAtIndex(input, map2.source.startIndex);
	expect(map2.source.startLine).toBe(expectedSource2.line);
	expect(map2.source.startChar).toBe(expectedSource2.char);
	expect(map2.compiled.startIndex).toBe(built.code.indexOf("const x"));
	let expectedCompiled2 = getLineAndCharAtIndex(built.code, map2.compiled.startIndex);
	expect(map2.compiled.startLine).toBe(expectedCompiled2.line);
	expect(map2.compiled.startChar).toBe(expectedCompiled2.char);

	//console.log("Y INDEX", input.indexOf("const y"));
	let index3 = input.indexOf("const y") - 2; // there's 2 newlines
	const map3 = built.map.find((m) => m.source.startIndex == index3);
	assert(map3);
	let expectedSource3 = getLineAndCharAtIndex(input, map3.source.startIndex);
	expect(map3.source.startLine).toBe(expectedSource3.line);
	expect(map3.source.startChar).toBe(expectedSource3.char);
	expect(map3.compiled.startIndex).toBe(built.code.indexOf("const y") - 2);
	let expectedCompiled3 = getLineAndCharAtIndex(built.code, map3.compiled.startIndex);
	expect(map3.compiled.startLine).toBe(expectedCompiled3.line);
	expect(map3.compiled.startChar).toBe(expectedCompiled3.char);
});

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
