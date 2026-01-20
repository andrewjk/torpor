import type StyleValue from "../types/StyleValue";

export default function buildStyles(value: StyleValue): string {
	if (typeof value === "string") {
		return value;
	} else {
		let styles: string[] = [];
		gatherStyles(value, styles);
		return styles.join("; ");
	}
}

function gatherStyles(value: unknown, styles: string[]) {
	if (value) {
		if (Array.isArray(value)) {
			for (let v of value) {
				gatherStyles(v, styles);
			}
		} else if (typeof value === "object") {
			for (let [n, v] of Object.entries(value)) {
				const key = n.replace(
					/[A-Z]+(?![a-z])|[A-Z]/g,
					(char, i) => (i > 0 ? "-" : "") + char.toLowerCase(),
				);
				styles.push(`${key}: ${v}`);
			}
		} else {
			styles.push(String(value));
		}
	}
}
