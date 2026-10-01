import { codeRanges } from "../../utils/codeScanner";
import type BuildStatus from "./BuildStatus";

/**
 * Loop variables that are *written* in the `@for` body (see `ForVar.shadow`)
 * can't be resolved through a `const` shadow binding, because the write must
 * propagate through the row's data bag. Their references are textually
 * substituted to the live data path instead (`row` → `item.data.row`), exactly
 * as before.
 *
 * Read-only loop variables are left alone: they resolve lexically against the
 * per-scope shadow bindings `forVarBindings` emits. This is what makes
 * shadowing and no-space operator styles work.
 *
 * Only code is rewritten: the contents of string literals, regex literals and
 * comments are left alone, so that e.g. prose inside a template string is not
 * mangled. The contents of `${...}` interpolations inside template strings are
 * code again.
 */
export default function replaceForVarNames(value: string, status: BuildStatus): string {
	// HACK: If a written variable from a for loop is used in the function body,
	// get it from the loop data to trigger an update when it is changed
	if (!status.forVars.some((forVar) => !forVar.shadow)) {
		return value;
	}

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
	for (let { name, path, shadow } of status.forVars) {
		if (shadow) continue;
		code = code.replaceAll(
			new RegExp(
				// The boundary characters are the ones that can legitimately
				// precede/follow an identifier reference -- including `?` for
				// optional chaining (`item?.name`) and nullish coalescing
				// (`fallback ?? item`).
				`(^|\\s|\\(|\\[|\\{|!|\\?|\\.\\.\\.)${name}($|\\s|\\.|,|\\(|\\)|\\[|\\]|\\}|;|\\?)`,
				"g",
			),
			`$1${path}$2`,
		);
	}
	return code;
}
