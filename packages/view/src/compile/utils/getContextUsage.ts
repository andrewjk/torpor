import trimQuotes from "./trimQuotes";

/**
 * Gets the `$context` names that the compiled output references. The input is
 * code-only text (a component's script plus markup expressions, or a slot
 * fill's collected expressions), with `ranges` marking the positions that are
 * code — matches that start inside a string, comment or regex literal are
 * ignored, so mentions inside sample-code strings don't count.
 */
export default function getContextUsage(
	source: string,
	ranges: [number, number][],
): string[] | undefined {
	const contextsMatches = source.matchAll(/\$context\??\s*(?:\.([\d\w]+)|\[([^\]]+)\])/g);
	const contexts: string[] = [];
	for (let match of contextsMatches) {
		if (!isInCode(ranges, match.index!)) continue;
		const name = trimQuotes(match[1] || match[2]);
		if (!contexts.includes(name)) {
			contexts.push(name);
		}
	}
	// Also check for bare `$context` references, e.g. passing the whole
	// context object to a function. These don't have a property accessor,
	// but still need the `$context` parameter to be declared. A following
	// `:` means it's a (re)declaration or type annotation, and a following
	// `<` means it's text in markup (e.g. "<code>$context</code>"), neither
	// of which count
	if (!contexts.length) {
		for (let match of source.matchAll(/(?<![\w$])\$context(?![\w])(?!\s*:)(?!<)/g)) {
			if (!isInCode(ranges, match.index!)) continue;
			contexts.push("$context");
			break;
		}
	}
	return contexts.length ? contexts : undefined;
}

/**
 * Returns true if `index` falls inside one of the (sorted, non-overlapping)
 * code ranges — i.e. not inside a string, comment or regex literal.
 */
export function isInCode(ranges: [number, number][], index: number): boolean {
	for (const [start, end] of ranges) {
		if (index >= start && index < end) return true;
		if (index < start) return false;
	}
	return false;
}
