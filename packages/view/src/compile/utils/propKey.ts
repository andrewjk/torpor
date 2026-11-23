// Matches a valid JavaScript identifier: starts with a letter, `_` or `$`,
// followed by letters, digits, `_` or `$`
const IDENTIFIER_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Formats a prop name for use as an object key in generated code. Valid
 * identifiers are left unquoted; anything else (e.g. dashed props like
 * `aria-hidden`) is quoted so that the generated code stays valid.
 *
 * @param name The prop name as written on the component or slot
 *
 * @returns The name as an object key text
 */
export default function propKey(name: string): string {
	return IDENTIFIER_REGEX.test(name) ? name : JSON.stringify(name);
}
