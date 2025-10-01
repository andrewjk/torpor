import { assert, expect, test } from "vitest";
import parse from "../../src/compile/parse";
import { att, el, root, text, trimParsed } from "../helpers";

test("attribute with double quotes", () => {
	const input = `
export default function Test() {
	@render {
		<a href="http://example.com">
		Link
		</a>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("a", [att("href", '"http://example.com"')], [text("Link")])]),
	);
});

test("attribute with single quotes", () => {
	const input = `
export default function Test() {
	@render {
		<a href='http://example.com'>
		Link
		</a>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("a", [att("href", "'http://example.com'")], [text("Link")])]),
	);
});

test("attribute with no quotes", () => {
	const input = `
export default function Test() {
	@render {
		<a href=http://example.com>
		Link
		</a>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("a", [att("href", "http://example.com")], [text("Link")])]),
	);
});

test("attribute with no quotes in self-closed element", () => {
	const input = `
export default function Test() {
	@render {
		<a href=http://example.com/>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("a", [att("href", "http://example.com")], [], true)]),
	);
});

test("multiple attributes", () => {
	const input = `
export default function Test() {
	@render {
		<a href1="http://example.com" href2='http://example.com' href3=http://example.com>
		Link
		</a>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([
			el(
				"a",
				[
					att("href1", '"http://example.com"'),
					att("href2", "'http://example.com'"),
					att("href3", "http://example.com"),
				],
				[text("Link")],
			),
		]),
	);
});

test("multiple attributes with no values", () => {
	const input = `
export default function Test() {
	@render {
		<input text required />
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("input", [att("text"), att("required")], [], true)]),
	);
});

test("event attribute with name", () => {
	const input = `
export default function Test() {
	@render {
		<button onclick={increment}>
		Increment
		</button>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("button", [att("onclick", "{increment}")], [text("Increment")])]),
	);
});

test("event attribute with code", () => {
	const input = `
export default function Test() {
	@render {
		<button onclick={() => {
			increment();
		}}>
			Increment
		</button>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([
			el("button", [att("onclick", "{() => {\n\t\t\tincrement();\n\t\t}}")], [text("Increment")]),
		]),
	);
});

test("shorthand attribute", () => {
	const input = `
export default function Test() {
	@render {
		<a {href}></a>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(root([el("a", [att("{href}")])]));
});

test("multiple shorthand attributes", () => {
	const input = `
export default function Test() {
	@render {
		<a {href1} {href2}></a>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) {/* @start */
	/* @render */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("a", [att("{href1}"), att("{href2}")])]),
	);
});
