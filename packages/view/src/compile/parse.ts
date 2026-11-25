import parseCode from "./parse/parseCode";
import type ParseResult from "./types/ParseResult";
import type ParseOptions from "./types/ParseOptions";

/**
 * Parses source code into a component template
 *
 * @param source The source code
 * @param options Optional parse behaviour
 *
 * @returns A result indicating whether parsing was ok, and if so, containing
 * the component template's parts such as script, markup and styles
 */
export default function parse(source: string, options?: ParseOptions): ParseResult {
	return parseCode(source, options);
}
