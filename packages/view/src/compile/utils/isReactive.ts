import { hasInterpolation } from "./interpolation";

/**
 * Checks whether the supplied text contains a `{...}` interpolation. Braces
 * inside the expression's strings and comments don't count as delimiters.
 *
 * @param text The text to check
 *
 * @returns True if the supplied text is fully or partially reactive
 */
export default function isReactive(text: string): boolean {
	return hasInterpolation(text);
}
