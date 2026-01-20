import ClassValue from "../types/ClassValue";

export default function buildClasses(value: ClassValue, styleHash?: string): string {
	if (typeof value === "string") {
		if (styleHash !== undefined) {
			value += " " + styleHash;
		}
		return value;
	} else {
		let classes: string[] = [];
		gatherClasses("", value, classes);
		if (styleHash !== undefined) {
			classes.push(styleHash);
		}
		return classes.join(" ");
	}
}

function gatherClasses(name: string, value: unknown, classes: string[]) {
	if (value) {
		if (Array.isArray(value)) {
			for (let v of value) {
				gatherClasses(v as string, v, classes);
			}
		} else if (typeof value === "object") {
			for (let [n, v] of Object.entries(value)) {
				gatherClasses(n, v, classes);
			}
		} else {
			classes.push(name);
		}
	}
}
