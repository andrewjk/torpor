import parseCode from "./compile/parse/parseCode";
import type ParseResult from "./compile/types/ParseResult";

/**
 * Parses source code into a component template
 *
 * @param name The name of the component
 * @param source The source code
 *
 * @returns A result indicating whether parsing was ok, and if so, containing
 * the component template's parts such as script, markup and styles
 */
export default function parse(name: string, source: string): ParseResult {
	return parseCode(name, source);
}
