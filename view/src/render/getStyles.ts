export default function getStyles(value: Record<string, any>): string {
	let styles: string[] = [];
	for (let [n, v] of Object.entries(value)) {
		styles.push(`${n}: ${v}`);
	}
	return styles.join("; ");
}
