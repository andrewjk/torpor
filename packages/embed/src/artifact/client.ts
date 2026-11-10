import { transform } from "sucrase";
import type EmbedArtifactImport from "../types/EmbedArtifactImport";
import EmbedCompileError from "../types/EmbedCompileError";

const IDENTIFIER_START = /[A-Za-z_$]/;
const IDENTIFIER_CHAR = /[A-Za-z0-9_$]/;

/**
 * Removes import declarations from compiled client code so it can run
 * against the loader-injected runtime/scope bindings (which arrive as
 * function parameters). A character-level scan — string, comment,
 * template-literal and regex-literal aware — instead of a line-anchored
 * regex, so multi-line imports are stripped cleanly and `import` appearing
 * inside strings, comments, or dynamic `import()`/`import.meta` expressions
 * is left alone.
 */
function stripImports(code: string): string {
	let out = "";
	let copied = 0; // everything before this index has been copied to `out`
	let i = 0;
	let prev = ""; // last significant (non-space) character consumed
	while (i < code.length) {
		const ch = code[i];

		// Line comment
		if (ch === "/" && code[i + 1] === "/") {
			const end = code.indexOf("\n", i);
			i = end === -1 ? code.length : end;
			continue;
		}
		// Block comment
		if (ch === "/" && code[i + 1] === "*") {
			const end = code.indexOf("*/", i + 2);
			i = end === -1 ? code.length : end + 2;
			continue;
		}
		// Quoted string
		if (ch === '"' || ch === "'") {
			i = skipQuoted(code, i, ch);
			prev = ch;
			continue;
		}
		// Template literal (with ${ … } interpolations scanned as code)
		if (ch === "`") {
			i = skipTemplate(code, i);
			prev = "`";
			continue;
		}
		// Regex literal, in expression position
		if (ch === "/" && isRegexStart(prev)) {
			i = skipRegex(code, i);
			prev = "/";
			continue;
		}

		if (IDENTIFIER_START.test(ch)) {
			const start = i;
			while (i < code.length && IDENTIFIER_CHAR.test(code[i])) i += 1;
			const word = code.slice(start, i);

			if (word !== "import") {
				prev = word[word.length - 1];
				continue;
			}

			// Peek past whitespace/comments: `import(` and `import.meta` are
			// expressions, and `import` can also appear as an object key or
			// a `:` label — none of those are import declarations.
			const peek = peekSignificant(code, i);
			if (peek === "(" || peek === "." || peek === ":" || peek === "}" || peek === ",") {
				prev = "t";
				continue;
			}

			// An import declaration: strip through its end
			const end = importDeclarationEnd(code, start);
			out += code.slice(copied, start);
			copied = end;
			i = end;
			prev = ";";
			continue;
		}

		if (!/\s/.test(ch)) prev = ch;
		i += 1;
	}

	out += code.slice(copied);
	return out;
}

/** Index of the next significant character at or after `i`. */
function peekSignificant(code: string, i: number): string {
	let j = i;
	while (j < code.length) {
		const ch = code[j];
		if (ch === "/" && code[j + 1] === "/") {
			const end = code.indexOf("\n", j);
			j = end === -1 ? code.length : end;
			continue;
		}
		if (ch === "/" && code[j + 1] === "*") {
			const end = code.indexOf("*/", j + 2);
			j = end === -1 ? code.length : end + 2;
			continue;
		}
		if (!/\s/.test(ch)) return ch;
		j += 1;
	}
	return "";
}

/** Index after a quoted string starting at `i`. Unterminated: end of code. */
function skipQuoted(code: string, i: number, quote: string): number {
	let j = i + 1;
	while (j < code.length) {
		if (code[j] === "\\") {
			j += 2;
			continue;
		}
		if (code[j] === quote) return j + 1;
		j += 1;
	}
	return code.length;
}

/**
 * Index after a template literal starting at `i`. `${ … }` interpolations
 * are scanned as code (strings, comments and nested templates handled).
 */
function skipTemplate(code: string, start: number): number {
	let i = start + 1;
	while (i < code.length) {
		if (code[i] === "\\") {
			i += 2;
			continue;
		}
		if (code[i] === "`") return i + 1;
		if (code[i] === "$" && code[i + 1] === "{") {
			i += 2;
			let depth = 1;
			while (i < code.length && depth > 0) {
				if (code[i] === "\\") {
					i += 2;
					continue;
				}
				if (code[i] === "'" || code[i] === '"') {
					i = skipQuoted(code, i, code[i]);
					continue;
				}
				if (code[i] === "`") {
					i = skipTemplate(code, i);
					continue;
				}
				if (code[i] === "{") depth += 1;
				else if (code[i] === "}") depth -= 1;
				i += 1;
			}
			continue;
		}
		i += 1;
	}
	return code.length;
}

/** Index after a regex literal starting at `i`. */
function skipRegex(code: string, i: number): number {
	let j = i + 1;
	let inClass = false;
	while (j < code.length) {
		const ch = code[j];
		if (ch === "\\") {
			j += 2;
			continue;
		}
		if (ch === "\n") return j; // not a regex after all; bail
		if (inClass) {
			if (ch === "]") inClass = false;
		} else if (ch === "[") {
			inClass = true;
		} else if (ch === "/") {
			return j + 1;
		}
		j += 1;
	}
	return code.length;
}

function isRegexStart(prev: string): boolean {
	if (prev === "") return true;
	// After an identifier character, a closing bracket/paren, or a quote,
	// a `/` is division, not a regex
	if (/[)\]}'"`a-z0-9_$]/i.test(prev)) return false;
	return true;
}

/**
 * Index after the import declaration starting at `start` (the position of
 * the `import` keyword): through the depth-0 `;`, or — for semicolon-less
 * style — through the line break that follows the module specifier.
 */
function importDeclarationEnd(code: string, start: number): number {
	let i = start + "import".length;
	let depth = 0;
	let seenSpecifier = false;
	while (i < code.length) {
		const ch = code[i];
		if (code[i] === "\\") {
			i += 2;
			continue;
		}
		if (ch === "/" && code[i + 1] === "/") {
			const end = code.indexOf("\n", i);
			i = end === -1 ? code.length : end;
			continue;
		}
		if (ch === "/" && code[i + 1] === "*") {
			const end = code.indexOf("*/", i + 2);
			i = end === -1 ? code.length : end + 2;
			continue;
		}
		if (ch === '"' || ch === "'") {
			i = skipQuoted(code, i, ch);
			seenSpecifier = true;
			continue;
		}
		if (ch === "`") {
			i = skipTemplate(code, i);
			seenSpecifier = true;
			continue;
		}
		if (ch === "{") depth += 1;
		else if (ch === "}") {
			depth -= 1;
			if (depth < 0) return i; // ran into enclosing code: stop here
		} else if (depth === 0 && ch === ";") {
			return i + 1;
		} else if (depth === 0 && ch === "\n" && seenSpecifier) {
			return i; // semicolon-less style: the line break ends the statement
		}
		i += 1;
	}
	return code.length;
}

/**
 * Prepares client code to run against the loader-injected runtime exports:
 * import declarations are removed, exports become plain declarations, and
 * TypeScript is removed.
 */
export function toClientCode(code: string): string {
	const stripped = stripImports(code)
		.replaceAll("export default function", "function")
		.replaceAll("export function", "function");
	return transform(stripped, { transforms: ["typescript"] }).code;
}

const IMPORT_SCAN =
	/import\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,\s*)?(?:\*\s+as\s+([A-Za-z_$][\w$]*)|\{([^}]*)\})?\s*from\s*["']([^"']+)["']/g;

/**
 * Records the bindings an embed's compiled code imports, per module: these
 * are the identifiers the loader must provide via the `scope` option (the
 * "@torpor/view" runtime is provided automatically, and type-only imports
 * are erased by the TypeScript transform, so neither is recorded).
 *
 * Handles the shapes the compiler and user code produce: named imports
 * (`import { A, B as C } from "x"`), default imports (`import D from "x"`),
 * namespaces (`import * as NS from "x"`) and combinations.
 */
export function scanImports(code: string): EmbedArtifactImport[] {
	const bySource = new Map<string, Set<string>>();
	for (const match of code.matchAll(IMPORT_SCAN)) {
		const [, defaultName, namespaceName, namedGroup, source] = match;
		if (source === "@torpor/view") continue;
		const names = bySource.get(source) ?? new Set<string>();
		if (defaultName) names.add(defaultName);
		if (namespaceName) names.add(namespaceName);
		if (namedGroup) {
			for (const part of namedGroup.split(",")) {
				const local =
					part
						.trim()
						.split(/\s+as\s+/)
						.pop()
						?.trim() ?? "";
				// Drop empty entries and inline type specifiers ("type X")
				if (local && !/^type\s/.test(part.trim())) names.add(local);
			}
		}
		if (names.size > 0) bySource.set(source, names);
	}
	return [...bySource].map(([source, names]) => ({ source, names: [...names].sort() }));
}

/**
 * Rejects embed sources over a byte limit, so a runaway author can't store
 * megabytes of code in one artifact.
 */
export function checkMaxSourceBytes(source: string, maxSourceBytes?: number): void {
	if (maxSourceBytes === undefined) return;
	const bytes = new TextEncoder().encode(source).length;
	if (bytes > maxSourceBytes) {
		throw new EmbedCompileError([
			{
				message: `Embed source is ${bytes} bytes, over the ${maxSourceBytes} byte limit`,
				startIndex: 0,
				startLine: 0,
				startChar: 0,
				endIndex: 0,
				endLine: 0,
				endChar: 0,
			},
		]);
	}
}
