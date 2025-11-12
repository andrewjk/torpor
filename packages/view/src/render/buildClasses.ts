export default function buildClasses(
	value:
		| string
		| Record<string, string>
		| Array<string | Record<string, string> | undefined>
		| undefined,
	styleHash?: string,
): string {
	if (typeof value === "string") {
		if (styleHash !== undefined) {
			value += " " + styleHash;
		}
		return value;
	} else {
		let classes: string[] = [];
		gatherNames("", value, classes);
		if (styleHash !== undefined) {
			classes.push(styleHash);
		}
		return classes.join(" ");
	}
}

function gatherNames(
	name: string,
	value:
		| string
		| Record<string, string>
		| Array<string | Record<string, string> | undefined>
		| undefined,
	classes: string[],
) {
	if (value) {
		if (Array.isArray(value)) {
			for (let v of value) {
				gatherNames(v as string, v, classes);
			}
		} else if (typeof value === "object") {
			for (let [n, v] of Object.entries(value)) {
				gatherNames(n, v, classes);
			}
		} else {
			classes.push(name);
		}
	}
}
