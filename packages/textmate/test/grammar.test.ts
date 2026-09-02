import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, test } from "vite-plus/test";
import { Registry } from "vscode-textmate";
import { createOnigScanner, createOnigString, loadWASM } from "vscode-oniguruma";
import grammars from "../src/index";

const require = createRequire(import.meta.url);

type Token = { text: string; scopes: string[] };

const torpor = grammars.find((grammar) => grammar.scopeName === "source.torp");
const typescript = grammars.find((grammar) => grammar.scopeName === "source.ts");

if (!torpor || !typescript) {
	throw new Error("Expected source.torp and source.ts grammars in src/index");
}

let tokenize: (source: string) => Token[];

beforeAll(async () => {
	const wasmPath = require.resolve("vscode-oniguruma/release/onig.wasm");
	await loadWASM({ data: await readFile(wasmPath) });

	const registry = new Registry({
		onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
		loadGrammar: async (scopeName) => {
			if (scopeName === "source.torp") return torpor;
			if (scopeName === "source.ts") return typescript;
			return null;
		},
	});

	const grammar = await registry.loadGrammar("source.torp");
	if (!grammar) {
		throw new Error("Failed to load the torpor grammar");
	}

	tokenize = (source) => {
		let ruleStack = null;
		const tokens: Token[] = [];
		for (const line of source.split("\n")) {
			const result = grammar.tokenizeLine(line, ruleStack);
			ruleStack = result.ruleStack;
			for (const token of result.tokens) {
				tokens.push({
					text: line.slice(token.startIndex, token.endIndex),
					scopes: token.scopes,
				});
			}
		}
		return tokens;
	};
});

/**
 * All text tokenized with the given scope, in document order. Asserting on the
 * joined text lets tests match across adjacent tokens (e.g. `@` and `if` are
 * tokenized separately).
 */
function scopedText(source: string, scope: string): string {
	return tokenize(source)
		.filter((token) => token.scopes.includes(scope))
		.map((token) => token.text)
		.join("");
}

function hasToken(source: string, text: string, scope: string): boolean {
	return scopedText(source, scope).includes(text);
}

function expectToken(source: string, text: string, scope: string) {
	expect(hasToken(source, text, scope), `expected '${text}' to have scope '${scope}'`).toBe(true);
}

function expectNoToken(source: string, text: string, scope: string) {
	expect(hasToken(source, text, scope), `expected '${text}' not to have scope '${scope}'`).toBe(
		false,
	);
}

const component = (body: string) => `function Component($props) {\n\t@render {\n${body}\t}\n}\n`;

describe("complete control syntax", () => {
	test("@if block", () => {
		expectToken(
			component(`\t\t@if ($state.light === "red") {\n\t\t\t<p>STOP</p>\n\t\t}\n`),
			"@if",
			"meta.control.if.block.torp",
		);
	});

	test("else if branch", () => {
		expectToken(
			component(
				`\t\t@if ($state.x) {\n\t\t\t<p>A</p>\n\t\t} else if ($state.y) {\n\t\t\t<p>B</p>\n\t\t}\n`,
			),
			"else",
			"meta.control.else-if.block.torp",
		);
	});

	test("else branch", () => {
		expectToken(
			component(`\t\t@if ($state.x) {\n\t\t\t<p>A</p>\n\t\t} else {\n\t\t\t<p>C</p>\n\t\t}\n`),
			"else",
			"meta.control.else.block.torp",
		);
	});

	test("@else with @ prefix", () => {
		expectToken(
			component(`\t\t@else {\n\t\t\t<p>C</p>\n\t\t}\n`),
			"else",
			"meta.control.else.block.torp",
		);
	});

	test("switch/case", () => {
		expectToken(
			component(
				`\t\t@switch ($props.value) {\n\t\t\tcase 1: {\n\t\t\t\t<p>A</p>\n\t\t\t}\n\t\t\tdefault: {\n\t\t\t\t<p>B</p>\n\t\t\t}\n\t\t}\n`,
			),
			"case",
			"meta.control.case.block.torp",
		);
	});

	test("@for block with @key", () => {
		expectToken(
			component(
				`\t\t@for (let color of colors) {\n\t\t\t@key = color\n\t\t\t<li>{color}</li>\n\t\t}\n`,
			),
			"@for",
			"meta.control.for.block.torp",
		);
	});

	test("@await without parens", () => {
		expectToken(
			component(
				`\t\t@await {\n\t\t\t<p>{user.name}</p>\n\t\t} with {\n\t\t\t<p>Loading</p>\n\t\t}\n`,
			),
			"@await",
			"meta.control.await.block.torp",
		);
	});

	test("with branch", () => {
		expectToken(
			component(`\t\t@await {\n\t\t\t<p>A</p>\n\t\t} with {\n\t\t\t<p>B</p>\n\t\t}\n`),
			"with",
			"meta.control.with.block.torp",
		);
	});

	test("@try block", () => {
		expectToken(
			component(
				`\t\t@try {\n\t\t\t@await {\n\t\t\t\t<p>A</p>\n\t\t\t}\n\t\t} catch (err) {\n\t\t\t<p>{err.message}</p>\n\t\t}\n`,
			),
			"@try",
			"meta.control.try.block.torp",
		);
	});

	test("catch branch", () => {
		expectToken(
			component(`\t\t@try {\n\t\t\t<p>A</p>\n\t\t} catch (err) {\n\t\t\t<p>B</p>\n\t\t}\n`),
			"catch",
			"meta.control.catch.block.torp",
		);
	});

	test("@error block", () => {
		expectToken(
			`function Component($props) {\n\t@render {\n\t\t<p>A</p>\n\t}\n\n\t@error (err) {\n\t\t<p>{err.message}</p>\n\t}\n}\n`,
			"@error",
			"meta.control.error.block.torp",
		);
	});

	test("@const line", () => {
		expectToken(
			component(`\t\t@const x = $state.count * 2\n\t\t<p>{x}</p>\n`),
			"@const",
			"meta.control.const.block.torp",
		);
	});

	test("@function block", () => {
		expectToken(
			component(
				`\t\t@function onClick() {\n\t\t\t$state.count++\n\t\t}\n\t\t<button onclick={onClick}/>\n`,
			),
			"@function",
			"meta.control.function.block.torp",
		);
	});

	test("@async function block", () => {
		expectToken(
			component(`\t\t@async function load() {\n\t\t\tawait fetch("/x")\n\t\t}\n`),
			"async",
			"meta.control.function.block.torp",
		);
	});
});

describe("multiline conditions", () => {
	test("multiline @if condition", () => {
		expectToken(
			component(
				`\t\t@if (\n\t\t\t$state.light === "red" &&\n\t\t\t!$state.done\n\t\t) {\n\t\t\t<p>STOP</p>\n\t\t}\n`,
			),
			"@if",
			"meta.control.if.condition.torp",
		);
	});

	test("multiline @for condition", () => {
		expectToken(
			component(`\t\t@for (\n\t\t\tlet x of xs\n\t\t) {\n\t\t\t<li/>\n\t\t}\n`),
			"@for",
			"meta.control.for.condition.torp",
		);
	});
});

describe("partial syntax", () => {
	test("bare @if", () => {
		expectToken(component(`\t\t@if\n`), "if", "meta.control.partial.torp");
	});

	test("@if with open paren", () => {
		expectToken(component(`\t\t@if (\n`), "if", "meta.control.if.condition.torp");
	});

	test("@if with unclosed condition", () => {
		expectToken(component(`\t\t@if ($state\n`), "if", "meta.control.if.condition.torp");
	});

	test("@for with unclosed condition", () => {
		expectToken(component(`\t\t@for (let x\n`), "for", "meta.control.for.condition.torp");
	});

	test("@switch with unclosed condition", () => {
		expectToken(component(`\t\t@switch ($stat\n`), "switch", "meta.control.switch.condition.torp");
	});

	test("bare @await", () => {
		expectToken(component(`\t\t@await\n`), "await", "meta.control.partial.torp");
	});

	test("bare @try", () => {
		expectToken(component(`\t\t@try\n`), "try", "meta.control.partial.torp");
	});

	test("bare @render", () => {
		expectToken(component(`\t\t@render\n`), "render", "meta.control.partial.torp");
	});

	test("bare @const", () => {
		expectToken(component(`\t\t@const\n`), "const", "meta.control.const.block.torp");
	});

	test("@if without brace", () => {
		expectToken(component(`\t\t@if (x)\n`), "if", "meta.control.if.condition.torp");
	});

	test("bare catch with open paren", () => {
		expectToken(
			component(`\t\t@if (a) {\n\t\t\t<p>A</p>\n\t\t} catch (\n`),
			"catch",
			"meta.control.catch.condition.torp",
		);
	});

	test("bare with", () => {
		expectToken(
			component(`\t\t@await {\n\t\t\t<p>A</p>\n\t\t} with\n`),
			"with",
			"meta.control.partial.torp",
		);
	});

	test("bare else", () => {
		expectToken(
			component(`\t\t@if (a) {\n\t\t\t<p>A</p>\n\t\t} else\n`),
			"else",
			"meta.control.partial.torp",
		);
	});

	test("complete syntax still wins over partial", () => {
		expectToken(
			component(`\t\t@if ($state.x) {\n\t\t\t<p>A</p>\n\t\t}\n`),
			"@if",
			"meta.control.if.block.torp",
		);
	});
});

describe("reactive primitives", () => {
	test("$watch in setup code", () => {
		expectToken(
			`function Component($props) {\n\tconst state = $watch({ count: 0 })\n\t@render {\n\t\t<p>{state.count}</p>\n\t}\n}\n`,
			"$watch",
			"support.function.reactive.torp",
		);
	});

	test("$async in setup code", () => {
		expectToken(
			`function Component($props) {\n\tconst user = $async(() => fetchUser($props.id))\n\t@render {\n\t\t<p>{user}</p>\n\t}\n}\n`,
			"$async",
			"support.function.reactive.torp",
		);
	});

	test("$state in a condition", () => {
		expectToken(
			component(`\t\t@if ($state.light) {\n\t\t\t<p>on</p>\n\t\t}\n`),
			"$state",
			"variable.language.reactive.torp",
		);
	});

	test("$state in text interpolation", () => {
		expectToken(
			component(`\t\t<p>The count is {$state.count}.</p>\n`),
			"$state",
			"variable.language.reactive.torp",
		);
	});

	test("$props in an attribute", () => {
		expectToken(
			component(`\t\t<a href={$props.href}>x</a>\n`),
			"$props",
			"variable.language.reactive.torp",
		);
	});

	test("in string literals too (the compiler treats $idents as real)", () => {
		expectToken(
			`function Component($props) {\n\tconst msg = "use $async here"\n\t@render {\n\t\t<p>{msg}</p>\n\t}\n}\n`,
			"$async",
			"support.function.reactive.torp",
		);
	});
});

describe("prose safety", () => {
	test("'case' in prose is not highlighted", () => {
		expectNoToken(
			component(`\t\t<p>In any case it works</p>\n`),
			"case",
			"meta.control.partial.torp",
		);
	});

	test("'with' in prose is not highlighted", () => {
		expectNoToken(
			component(`\t\t<p>with a little luck</p>\n`),
			"with",
			"meta.control.partial.torp",
		);
	});

	test("'default' in prose is not highlighted", () => {
		expectNoToken(
			component(`\t\t<p>The default is fine</p>\n`),
			"default",
			"meta.control.partial.torp",
		);
	});
});
