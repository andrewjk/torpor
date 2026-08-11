import type StyleValue from "../types/StyleValue";

const CAMEL_TO_DASH = /[A-Z]+(?![a-z])|[A-Z]/g;

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
				if (v === null || v === undefined) continue;
				const key = n.replace(CAMEL_TO_DASH, (char, i) => (i > 0 ? "-" : "") + char.toLowerCase());
				styles.push(`${key}: ${v}`);
			}
		} else {
			// oxlint-disable-next-line typescript/no-base-to-string
			styles.push(String(value));
		}
	}
}
