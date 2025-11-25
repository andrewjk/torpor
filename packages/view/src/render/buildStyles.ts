import type StyleValue from "../types/StyleValue";

export default function buildStyles(value: StyleValue): string {
	if (typeof value === "string") {
		return value;
	} else {
		let styles: string[] = [];
		if (value) {
			if (Array.isArray(value)) {
				for (let v of value) {
					if (v) {
						styles.push(v);
					}
				}
			} else if (typeof value === "object") {
				for (let [n, v] of Object.entries(value)) {
					const key = n.replace(
						/[A-Z]+(?![a-z])|[A-Z]/g,
						(char, i) => (i > 0 ? "-" : "") + char.toLowerCase(),
					);
					styles.push(`${key}: ${v}`);
				}
			}
		}
		return styles.join("; ");
	}
}
