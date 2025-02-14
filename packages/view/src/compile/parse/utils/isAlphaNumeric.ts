import isAlphaNumericChar from "./isAlphaNumericChar";

/**
 * Checks whether the supplied string contains only alpha-numeric characters
 *
 * @param text The string to check
 *
 * @returns True if the supplied string contains only alpha-numeric characters
 */
export default function isAlphaNumeric(text: string) {
	for (let i = 0; i < text.length; i++) {
		if (!isAlphaNumericChar(text, i)) {
			return false;
		}
	}
	return true;
}
