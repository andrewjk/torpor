import { parseExpressionPrefix, RestrictedSyntaxError } from "./parseExpression";
import type { RestrictedExpr } from "./types";

export interface RestrictedSpecEntry {
	key: string;
	expr: RestrictedExpr;
	/** Absolute source indices, for kind validators to report against. */
	keyStart: number;
	valueStart: number;
	valueEnd: number;
}

const SPACE = /[ \t\r\n]/;
const IDENT_START = /[A-Za-z_$]/;
const IDENT_CHAR = /[A-Za-z0-9_$]/;

/**
 * Parses a requirement spec (`{ url: "…", params: { queue: $props.queue } }`
 * with the outer braces already stripped) into key/expression entries.
 *
 * Values use the restricted expression grammar, so props references are
 * allowed but no code: the spec is inert data that the host resolves.
 */
export default function parseRequirementSpec(
	source: string,
	offset: number,
): RestrictedSpecEntry[] {
	const entries: RestrictedSpecEntry[] = [];
	const seen = new Set<string>();
	let i = 0;

	const fail: (message: string, start: number, end?: number) => never = (
		message,
		start,
		end = start + 1,
	) => {
		throw new RestrictedSyntaxError(message, offset + start, offset + end);
	};

	const skipSpace = () => {
		while (i < source.length && SPACE.test(source[i])) i += 1;
	};

	skipSpace();
	while (i < source.length) {
		const keyStart = i;
		let key: string;

		const char = source[i];
		if (char === '"' || char === "'") {
			const quote = char;
			i += 1;
			let value = "";
			let closed = false;
			while (i < source.length) {
				if (source[i] === quote) {
					i += 1;
					closed = true;
					break;
				}
				if (source[i] === "\\") {
					value += source[i + 1] ?? "";
					i += 2;
					continue;
				}
				value += source[i];
				i += 1;
			}
			if (!closed) fail("Unterminated string spec key", keyStart, i);
			key = value;
		} else if (IDENT_START.test(char)) {
			const start = i;
			while (i < source.length && IDENT_CHAR.test(source[i])) i += 1;
			key = source.substring(start, i);
		} else {
			fail(`Expected a spec key but found "${char}"`, i);
		}

		if (seen.has(key)) fail(`Duplicate spec key "${key}"`, keyStart, i);
		seen.add(key);

		skipSpace();
		if (source[i] !== ":") fail('Expected ":" after spec key', i);
		i += 1;
		skipSpace();

		const valueStart = i;
		const parsed = parseExpressionPrefix(source.substring(i), offset + i);
		const valueEnd = parsed.end;
		i = valueEnd - offset;
		entries.push({
			key,
			expr: parsed.expression,
			keyStart: offset + keyStart,
			valueStart,
			valueEnd,
		});

		skipSpace();
		if (i < source.length) {
			if (source[i] !== ",") fail('Expected "," between spec entries', i);
			i += 1;
			skipSpace();
			// Trailing commas are allowed, like object literals
		}
	}

	return entries;
}
