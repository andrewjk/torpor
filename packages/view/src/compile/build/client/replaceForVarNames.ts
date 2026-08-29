import { codeRanges } from "../../utils/codeScanner";
import type BuildStatus from "./BuildStatus";

/**
 * Variables used within a for loop need to be retrieved from the loop data.
 */
export default function replaceForVarNames(value: string, status: BuildStatus): string {
	// HACK: If a value from a for loop is used in the function body,
	// get it from the loop data to trigger an update when it is changed
	if (status.forVarNames.length === 0) {
		return value;
	}

	// Only rewrite code: the contents of string literals, regex literals and
	// comments are left alone, so that e.g. prose inside a template string is
	// not mangled. The contents of `${...}` interpolations inside template
	// strings are code again.
	let result = "";
	let index = 0;
	for (let [start, end] of codeRanges(value)) {
		result += value.substring(index, start);
		result += replaceVarNames(value.substring(start, end), status);
		index = end;
	}
	result += value.substring(index);
	return result;
}

function replaceVarNames(code: string, status: BuildStatus): string {
	for (let varName of status.forVarNames) {
		code = code.replaceAll(
			new RegExp(
				// The boundary characters are the ones that can legitimately
				// precede/follow an identifier reference -- including `?` for
				// optional chaining (`item?.name`) and nullish coalescing
				// (`fallback ?? item`).
				`(^|\\s|\\(|\\[|\\{|!|\\?|\\.\\.\\.)${varName[0]}($|\\s|\\.|,|\\(|\\)|\\[|\\]|\\}|;|\\?)`,
				"g",
			),
			`$1${varName[1]}$2`,
		);
	}
	return code;
}
