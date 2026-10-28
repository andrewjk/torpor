const HYDRATION_START = "[";
const HYDRATION_END = "]";
const HYDRATION_BREAK = "^";

// A branch-break marker's data: `^`, or `^<index>` when the server wrote
// which branch it rendered into the marker (e.g. `^2` for the third branch
// of an `@if`/`@switch`)
const HYDRATION_BREAK_REGEX = /^\^(?:\d+)?$/;

/**
 * Whether a comment node's data is a branch-break marker (`^`, or `^<index>`
 * when the server recorded the branch it rendered).
 */
export function isHydrationBreak(data: string): boolean {
	return HYDRATION_BREAK_REGEX.test(data);
}

/**
 * The branch index encoded in a `^<index>` branch-break marker, or `undefined`
 * for a plain `^` marker (e.g. from `@for`, which has no branch index).
 */
export function hydrationBreakIndex(data: string): number | undefined {
	if (!data.startsWith(HYDRATION_BREAK) || data.length === 1) {
		return undefined;
	}
	const index = Number(data.slice(1));
	return Number.isNaN(index) ? undefined : index;
}

export { HYDRATION_START, HYDRATION_END, HYDRATION_BREAK };
