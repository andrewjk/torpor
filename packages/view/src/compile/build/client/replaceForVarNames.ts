import type BuildStatus from "./BuildStatus";

/**
 * Variables used within a for loop need to be retrieved from the loop data.
 */
export default function replaceForVarNames(value: string, status: BuildStatus): string {
	// HACK: If a value from a for loop is used in the function body,
	// get it from the loop data to trigger an update when it is changed
	for (let varName of status.forVarNames) {
		value = value.replaceAll(
			new RegExp(`(^|\\s|\\(|\\[|\\{|!)${varName[0]}($|\\s|\\.|,|\\(|\\)|\\[|\\]|\\}|;)`, "g"),
			`$1${varName[1]}$2`,
		);
	}
	return value;
}
