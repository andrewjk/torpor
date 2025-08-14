export default function buildClasses(value: unknown, styleHash?: string): string {
	if (typeof value === "string") {
		if (styleHash) {
			value += " " + styleHash;
		}
		return value;
	} else {
		let classes: string[] = [];
		gatherNames("", value, classes);
		if (styleHash) {
			classes.push(styleHash);
		}
		return classes.join(" ");
	}
}

function gatherNames(name: unknown, value: unknown, classes: string[]) {
	if (value) {
		if (Array.isArray(value)) {
			for (let v of value) {
				gatherNames(v, v, classes);
			}
		} else if (typeof value === "object") {
			for (let [n, v] of Object.entries(value)) {
				gatherNames(n, v, classes);
			}
		} else {
			classes.push(name as string);
		}
	}
}
