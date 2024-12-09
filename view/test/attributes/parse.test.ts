import { beforeAll, expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("a", [att("href", '"http://example.com"')], [text("Link")])]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("a", [att("href", "'http://example.com'")], [text("Link")])]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("a", [att("href", "http://example.com")], [text("Link")])]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("a", [att("href", "http://example.com")], [], true)]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([
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
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("input", [att("text"), att("required")], [], true)]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("button", [att("onclick", "{increment}")], [text("Increment")])]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([
						el(
							"button",
							[att("onclick", "{() => {\n\t\t\tincrement();\n\t\t}}")],
							[text("Increment")],
						),
					]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("a", [att("{href}")])]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
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
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("a", [att("{href1}"), att("{href2}")])]),
				},
			],
		},
	};
	expect(output).toEqual(expected);
});
