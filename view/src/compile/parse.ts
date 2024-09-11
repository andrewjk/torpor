import parseCode from "./internal/parse/parseCode";
import type ParseResult from "./types/ParseResult";

/**
 * Parses source code into a component template
 * @param source The template's source code
 * @returns A result indicating whether parsing was ok, and if so, containing
 *          the component template's parts such as script, markup and styles
 */
export default function parse(source: string): ParseResult {
	return parseCode(source);
}
