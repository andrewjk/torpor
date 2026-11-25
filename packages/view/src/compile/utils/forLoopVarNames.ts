import { skipStringOrComment } from "./codeScanner";

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Extracts the declared loop variable names from a `@for` statement — the
 * header parse shared by `buildForNode` (codegen) and the write scanners
 * (`forVarsWrittenIn`/`forVarsReassignedIn`, which use it to detect nested
 * loops that shadow an outer loop's variables).
 *
 * Handles the C-style (`for (let i = 0; i < n; i++)`), for-of and for-in
 * forms, including comments, strings, nested destructuring and defaults.
 */
export default function forLoopVarNames(statement: string): string[] {
	const source = maskComments(statement);
	const forIndex = source.indexOf("for");
	if (forIndex === -1) return [];

	const open = source.indexOf("(", forIndex + 3);
	if (open === -1) return [];
	const close = findMatching(source, open, "(", ")");
	if (close === -1) return [];

	const header = source.slice(open + 1, close);
	const names: string[] = [];

	// C-style: the declaration is the part before the first top-level `;`.
	const firstSemi = findTopLevel(header, (char) => char === ";");
	if (firstSemi !== -1) {
		const declaration = stripDeclarationKeyword(header.slice(0, firstSemi));
		for (const declarator of splitTopLevel(declaration, ",")) {
			const eq = findTopLevel(declarator, (char) => char === "=");
			collectBindings(eq === -1 ? declarator : declarator.slice(0, eq), names);
		}
		return [...new Set(names)];
	}

	// for-of / for-in: the declaration is the part before the keyword.
	const keyword = findLoopKeyword(header);
	if (keyword !== -1) {
		const declaration = stripDeclarationKeyword(header.slice(0, keyword));
		collectBindings(declaration, names);
	}
	return [...new Set(names)];
}

/** Replaces comments with spaces, preserving length and string contents. */
function maskComments(source: string): string {
	let masked = "";
	for (let i = 0; i < source.length; i++) {
		const skipped = skipStringOrComment(source, i);
		if (skipped === -1) {
			masked += source[i];
			continue;
		}
		if (source[i] === "/" && (source[i + 1] === "/" || source[i + 1] === "*")) {
			masked += source.substring(i, skipped).replaceAll(/[^\r\n]/g, " ");
		} else {
			masked += source.substring(i, skipped);
		}
		i = skipped - 1;
	}
	return masked;
}

/** Finds the close delimiter matching the opener at `start`. */
function findMatching(
	source: string,
	start: number,
	open: "(" | "[" | "{",
	close: ")" | "]" | "}",
): number {
	let depth = 0;
	for (let i = start; i < source.length; i++) {
		const skipped = skipStringOrComment(source, i);
		if (skipped !== -1) {
			i = skipped - 1;
			continue;
		}
		const char = source[i];
		if (char === open) {
			depth += 1;
		} else if (char === close) {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/** Finds the first match of `predicate` outside nested delimiters and strings. */
function findTopLevel(source: string, predicate: (char: string, index: number) => boolean): number {
	let depth = 0;
	for (let i = 0; i < source.length; i++) {
		const skipped = skipStringOrComment(source, i);
		if (skipped !== -1) {
			i = skipped - 1;
			continue;
		}
		const char = source[i];
		if (char === "(" || char === "[" || char === "{") {
			depth += 1;
		} else if (char === ")" || char === "]" || char === "}") {
			depth -= 1;
		} else if (depth === 0 && predicate(char, i)) {
			return i;
		}
	}
	return -1;
}

/** Finds a top-level `of` or `in` keyword. */
function findLoopKeyword(source: string): number {
	let depth = 0;
	for (let i = 0; i < source.length; i++) {
		const skipped = skipStringOrComment(source, i);
		if (skipped !== -1) {
			i = skipped - 1;
			continue;
		}
		const char = source[i];
		if (char === "(" || char === "[" || char === "{") {
			depth += 1;
			continue;
		}
		if (char === ")" || char === "]" || char === "}") {
			depth -= 1;
			continue;
		}
		if (depth !== 0) continue;

		for (const keyword of ["of", "in"]) {
			if (!source.startsWith(keyword, i)) continue;
			const previous = source[i - 1];
			const next = source[i + keyword.length];
			if (
				(previous === undefined || !isIdentifierChar(previous)) &&
				(next === undefined || !isIdentifierChar(next))
			) {
				return i;
			}
		}
	}
	return -1;
}

/** Splits at a separator that isn't inside strings or nested delimiters. */
function splitTopLevel(source: string, separator: string): string[] {
	const parts: string[] = [];
	let start = 0;
	let depth = 0;
	for (let i = 0; i < source.length; i++) {
		const skipped = skipStringOrComment(source, i);
		if (skipped !== -1) {
			i = skipped - 1;
			continue;
		}
		const char = source[i];
		if (char === "(" || char === "[" || char === "{") {
			depth += 1;
		} else if (char === ")" || char === "]" || char === "}") {
			depth -= 1;
		} else if (depth === 0 && char === separator) {
			parts.push(source.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(source.slice(start));
	return parts;
}

function stripDeclarationKeyword(declaration: string): string {
	return declaration.trim().replace(/^(?:let|var|const)\b\s*/, "");
}

function collectBindings(pattern: string, names: string[]): void {
	pattern = pattern.trim();
	if (!pattern) return;

	const open = pattern[0];
	if (open === "{") {
		const close = findMatching(pattern, 0, "{", "}");
		if (close === -1) return;
		for (const property of splitTopLevel(pattern.slice(1, close), ",")) {
			collectObjectBinding(property.trim(), names);
		}
		return;
	}

	if (open === "[") {
		const close = findMatching(pattern, 0, "[", "]");
		if (close === -1) return;
		for (let element of splitTopLevel(pattern.slice(1, close), ",")) {
			element = element.trim();
			if (!element) continue;
			if (element.startsWith("...")) element = element.slice(3).trim();
			const eq = findTopLevel(element, (char) => char === "=");
			collectBindings(eq === -1 ? element : element.slice(0, eq), names);
		}
		return;
	}

	// Simple binding: `name` or `name = default`
	const eq = findTopLevel(pattern, (char) => char === "=");
	const name = (eq === -1 ? pattern : pattern.slice(0, eq)).trim();
	if (IDENTIFIER.test(name)) names.push(name);
}

function collectObjectBinding(property: string, names: string[]): void {
	property = property.trim();
	if (!property) return;

	if (property.startsWith("...")) {
		collectBindings(property.slice(3).trim(), names);
		return;
	}

	const colon = findTopLevel(property, (char) => char === ":");
	const eq = findTopLevel(property, (char) => char === "=");
	if (colon !== -1 && (eq === -1 || colon < eq)) {
		// Renamed/nested property: `{ name: alias }`
		collectBindings(property.slice(colon + 1).trim(), names);
		return;
	}

	// Shorthand property: `{ name }` or `{ name = default }`
	const name = (eq === -1 ? property : property.slice(0, eq)).trim();
	if (IDENTIFIER.test(name)) names.push(name);
}

function isIdentifierChar(char: string): boolean {
	return /[A-Za-z0-9_$]/.test(char);
}
