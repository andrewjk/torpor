/**
 * Checks whether the supplied string is fully or partially reactive (i.e. contains braces)
 *
 * @param text The string to check
 *
 * @returns True if the supplied string is fully or partially reactive
 */
export default function isReactive(text: string): boolean {
	// TODO: Need to be more fancy (check that braces match, ignore comments and strings etc)
	return text.includes("{") && text.includes("}");
}
