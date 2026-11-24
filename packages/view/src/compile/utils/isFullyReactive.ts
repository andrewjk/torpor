import { isSingleInterpolation } from "./interpolation";

/**
 * Checks whether the supplied text is exactly one `{...}` interpolation,
 * ignoring surrounding whitespace. Braces inside the expression's strings and
 * comments don't count as delimiters.
 *
 * @param text The text to check
 *
 * @returns True if the supplied text is fully reactive
 */
export default function isFullyReactive(text: string): boolean {
	return isSingleInterpolation(text);
}
