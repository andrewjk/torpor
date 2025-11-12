import type StyleValue from "../types/StyleValue";

export default function buildStyles(value: StyleValue): string {
	if (typeof value === "string") {
		return value;
	} else {
		let styles: string[] = [];
		if (value) {
			if (Array.isArray(value)) {
				for (let v of value) {
					styles.push(v);
				}
			} else if (typeof value === "object") {
				for (let [n, v] of Object.entries(value)) {
					styles.push(`${n}: ${v}`);
				}
			}
		}
		return styles.join("; ");
	}
}
