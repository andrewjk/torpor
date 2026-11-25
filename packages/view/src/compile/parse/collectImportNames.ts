import { skipStringOrComment } from "../utils/codeScanner";

/**
 * Collects the local binding names introduced by top-level import statements.
 * Used to tell component tags apart from native elements without touching the
 * filesystem or relying on a tag-name convention.
 *
 * This is a focused import scanner, not a general JS parser: it handles the
 * import forms (`default`, `* as`, named/aliased, side-effect), comments and
 * multiline clauses. Type-only imports are ignored (they don't introduce a
 * value that can be rendered as a tag).
 */
export default function collectImportNames(source: string): Set<string> {
	const names = new Set<string>();
	let depth = 0;
	let i = 0;

	while (i < source.length) {
		const skipped = skipStringOrComment(source, i);
		if (skipped !== -1) {
			i = skipped;
			continue;
		}

		const char = source[i];
		if (char === "{") {
			depth += 1;
			i += 1;
			continue;
		}
		if (char === "}") {
			depth -= 1;
			i += 1;
			continue;
		}

		if (depth === 0 && char === "i" && startsWordAt(source, i, "import") && source[i - 1] !== ".") {
			const end = parseImport(source, i + "import".length, names);
			if (end !== -1) {
				i = end;
				continue;
			}
		}

		i += 1;
	}

	return names;
}

/** Parses one import statement, adding its value bindings. Returns the end index. */
function parseImport(source: string, start: number, names: Set<string>): number {
	let i = skipSpaceAndComments(source, start);
	if (i >= source.length) return -1;

	if (source[i] === "." || source[i] === "(") {
		// import.meta / dynamic import()
		return -1;
	}

	// Side-effect import: import "module"
	if (source[i] === '"' || source[i] === "'") {
		return skipStringAndStatementEnd(source, i);
	}

	let typeOnly = false;
	if (startsWordAt(source, i, "type")) {
		const afterType = skipSpaceAndComments(source, i + "type".length);
		const next = source[afterType];
		if (next === "{" || next === "*" || isIdentifierStart(next)) {
			// `import type { … }`, `import type * as X`, and
			// `import type Foo from …` are all type-only. A default import
			// literally named `type` is rare; require `from` here to tell it
			// apart from `import type, { … }` / `import type from …`.
			if (next === "{" || next === "*" || isTypeOnlyDefault(source, afterType)) {
				typeOnly = true;
				i = afterType;
			}
		}
	}

	while (i < source.length) {
		i = skipSpaceAndComments(source, i);
		if (i >= source.length) return -1;

		if (startsWordAt(source, i, "from")) {
			i = skipStringAndStatementEnd(source, skipSpaceAndComments(source, i + "from".length));
			return i;
		}

		const char = source[i];
		if (char === "{") {
			i += 1;
			// Named imports
			while (i < source.length) {
				i = skipSpaceAndComments(source, i);
				if (source[i] === "}") {
					i += 1;
					break;
				}

				const specifier = parseSpecifier(source, i);
				if (!specifier) {
					// Malformed -- skip a character and let the main loop recover
					i += 1;
					continue;
				}
				i = specifier.end;
				if (!typeOnly && specifier.name) names.add(specifier.name);
			}
			continue;
		}

		if (char === "*") {
			i = skipSpaceAndComments(source, i + 1);
			if (startsWordAt(source, i, "as")) {
				i = skipSpaceAndComments(source, i + "as".length);
				const identifier = readIdentifier(source, i);
				if (identifier) {
					if (!typeOnly) names.add(identifier.name);
					i = identifier.end;
				}
			}
			continue;
		}

		if (char === ",") {
			i += 1;
			continue;
		}

		if (isIdentifierStart(char)) {
			const identifier = readIdentifier(source, i);
			if (identifier) {
				// `from` was checked above, so this is the default import name
				if (!typeOnly) names.add(identifier.name);
				i = identifier.end;
				continue;
			}
		}

		// Unexpected character before `from`; skip it and keep scanning
		i += 1;
	}

	return -1;
}

function parseSpecifier(source: string, start: number): { name?: string; end: number } | undefined {
	let i = skipSpaceAndComments(source, start);
	if (i >= source.length) return undefined;

	let typeOnly = false;
	// `type Foo` / `type Foo as Bar` are type-only specifiers
	if (startsWordAt(source, i, "type")) {
		const afterType = skipSpaceAndComments(source, i + "type".length);
		const next = source[afterType];
		if (next && next !== "," && next !== "}" && !startsWordAt(source, afterType, "as")) {
			typeOnly = true;
			i = afterType;
		}
	}

	let name: string | undefined;
	if (source[i] === '"' || source[i] === "'") {
		const end = skipStringOrComment(source, i);
		i = end === -1 ? i + 1 : end;
	} else {
		const identifier = readIdentifier(source, i);
		if (!identifier) return undefined;
		name = identifier.name;
		i = identifier.end;
	}

	i = skipSpaceAndComments(source, i);
	if (startsWordAt(source, i, "as")) {
		i = skipSpaceAndComments(source, i + "as".length);
		if (source[i] === '"' || source[i] === "'") {
			const end = skipStringOrComment(source, i);
			i = end === -1 ? i + 1 : end;
			name = undefined;
		} else {
			const alias = readIdentifier(source, i);
			if (alias) {
				name = alias.name;
				i = alias.end;
			}
		}
	}

	// Skip the comma/close brace for the caller's loop
	i = skipSpaceAndComments(source, i);
	if (source[i] === ",") i += 1;

	return { name: typeOnly ? undefined : name, end: i };
}

function isTypeOnlyDefault(source: string, start: number): boolean {
	const identifier = readIdentifier(source, start);
	if (!identifier) return false;
	const afterName = skipSpaceAndComments(source, identifier.end);
	return startsWordAt(source, afterName, "from");
}

function skipStringAndStatementEnd(source: string, start: number): number {
	let i = start;
	if (source[i] === '"' || source[i] === "'") {
		const end = skipStringOrComment(source, i);
		i = end === -1 ? i + 1 : end;
	}
	i = skipSpaceAndComments(source, i);
	if (source[i] === ";") i += 1;
	return i;
}

function skipSpaceAndComments(source: string, start: number): number {
	let i = start;
	while (i < source.length) {
		if (/\s/.test(source[i])) {
			i += 1;
			continue;
		}
		const char = source[i];
		if (char === "/" && (source[i + 1] === "/" || source[i + 1] === "*")) {
			const skipped = skipStringOrComment(source, i);
			if (skipped !== -1) {
				i = skipped;
				continue;
			}
		}
		break;
	}
	return i;
}

function readIdentifier(source: string, start: number): { name: string; end: number } | undefined {
	if (!isIdentifierStart(source[start])) return undefined;
	let end = start + 1;
	while (end < source.length && isIdentifierPart(source[end])) end += 1;
	return { name: source.substring(start, end), end };
}

function isIdentifierStart(char: string | undefined): boolean {
	return char !== undefined && /[A-Za-z_$]/.test(char);
}

function isIdentifierPart(char: string): boolean {
	return /[A-Za-z0-9_$]/.test(char);
}

function startsWordAt(source: string, start: number, word: string): boolean {
	if (!source.startsWith(word, start)) return false;
	const previous = source[start - 1];
	const next = source[start + word.length];
	return (
		(previous === undefined || !isIdentifierPart(previous)) &&
		(next === undefined || !isIdentifierPart(next))
	);
}
