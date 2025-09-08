/**
 * Checks whether the supplied string is fully reactive (i.e. starts and ends with braces)
 *
 * @param text The string to check
 *
 * @returns True if the supplied string is fully reactive
 */
export default function isFullyReactive(text: string): boolean {
	// TODO: Need to be more fancy (check that braces match, ignore comments and strings etc)
	return text.trim().startsWith("{") && text.trim().endsWith("}");
}
