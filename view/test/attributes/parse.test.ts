import { expect, test } from "vitest";
import type ParseResult from "../../src/compile/types/ParseResult";
import parse from "../../src/parse";
import { att, el, root, text, trimParsed } from "../helpers";

test("attribute with double quotes", () => {
	const input = `
<a href="http://example.com">
  Link
</a>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("a", [att("href", '"http://example.com"')], [text("Link")])]),
		},
	};
	expect(output).toEqual(expected);
});

test("attribute with single quotes", () => {
	const input = `
<a href='http://example.com'>
  Link
</a>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("a", [att("href", "'http://example.com'")], [text("Link")])]),
		},
	};
	expect(output).toEqual(expected);
});

test("attribute with no quotes", () => {
	const input = `
<a href=http://example.com>
  Link
</a>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("a", [att("href", "http://example.com")], [text("Link")])]),
		},
	};
	expect(output).toEqual(expected);
});

test("attribute with no quotes in self-closed element", () => {
	const input = `
<a href=http://example.com/>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("a", [att("href", "http://example.com")], [], true)]),
		},
	};
	expect(output).toEqual(expected);
});

test("multiple attributes", () => {
	const input = `
<a href1="http://example.com" href2='http://example.com' href3=http://example.com>
  Link
</a>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
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
	};
	expect(output).toEqual(expected);
});

test("event attribute with name", () => {
	const input = `
<button onclick={increment}>
  Increment
</button>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("button", [att("onclick", "{increment}")], [text("Increment")])]),
		},
	};
	expect(output).toEqual(expected);
});

test("event attribute with code", () => {
	const input = `
<button onclick={() => {
  increment();
}}>
  Increment
</button>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([
				el("button", [att("onclick", "{() => {\n  increment();\n}}")], [text("Increment")]),
			]),
		},
	};
	expect(output).toEqual(expected);
});

test("shorthand attribute", () => {
	const input = `
<a {href}></a>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("a", [att("{href}", "")])]),
		},
	};
	expect(output).toEqual(expected);
});

test("multiple shorthand attributes", () => {
	const input = `
<a {href1} {href2}></a>
`;

	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			markup: root([el("a", [att("{href1}", ""), att("{href2}", "")])]),
		},
	};
	expect(output).toEqual(expected);
});
