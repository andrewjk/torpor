import isSpaceChar from "./isSpaceChar";

/**
 * Checks whether the supplied string contains only space characters
 *
 * @param text The string to check
 *
 * @returns True if the supplied string contains only space characters
 */
export default function isSpace(text: string) {
	for (let i = 0; i < text.length; i++) {
		if (!isSpaceChar(text, i)) {
			return false;
		}
	}
	return true;
}
