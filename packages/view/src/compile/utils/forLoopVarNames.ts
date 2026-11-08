/**
 * Extracts the declared loop variable names from a `@for` statement — the
 * heuristic header parse shared by `buildForNode` (codegen) and the write
 * scanners (`forVarsWrittenIn`/`forVarsReassignedIn`, which use it to detect
 * nested loops that shadow an outer loop's variables).
 *
 * Handles the C-style (`for (let i = 0; i < n; i++)`), for-of and for-in
 * forms, with destructuring flattened to the bare names. TODO: Handle
 * destructuring, quotes, comments etc (same as buildForNode's note — this is
 * deliberately the same heuristic).
 */
export default function forLoopVarNames(statement: string): string[] {
	const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
	const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
	const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;
	const trimMatched = (value: string, start: string, end: string): string => {
		const startIndex = value.indexOf(start);
		const endIndex = value.lastIndexOf(end);
		if (startIndex === -1 || endIndex === -1) return value;
		return value.slice(startIndex + 1, endIndex);
	};

	const names: string[] = [];
	const forLoopMatch = statement.match(forLoopRegex);
	if (forLoopMatch) {
		const forVarMatches = forLoopMatch[1].matchAll(forLoopVarsRegex);
		for (const match of forVarMatches) {
			names.push(match[1]);
		}
		return names;
	}

	const forOfMatch = statement.match(forOfRegex);
	if (forOfMatch) {
		const match = forOfMatch[1];
		if (
			(match.startsWith("{") && match.endsWith("}")) ||
			(match.startsWith("[") && match.endsWith("]"))
		) {
			names.push(
				...trimMatched(trimMatched(match, "{", "}"), "[", "]")
					.split(",")
					.map((m) => m.trim()),
			);
		} else {
			names.push(match);
		}
	}
	return names;
}
