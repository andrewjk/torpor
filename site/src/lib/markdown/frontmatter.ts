/**
 * Parses the raw frontmatter block from a document's root node (e.g.
 * "---\ntitle: Test\n---") into a plain key/value record. Values are trimmed,
 * with a single level of surrounding quotes removed.
 */
export default function parseFrontmatter(info: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (let line of info.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (trimmed === "---" || trimmed === "") continue;
		const i = trimmed.indexOf(":");
		if (i === -1) continue;
		const key = trimmed.slice(0, i).trim();
		let value = trimmed.slice(i + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (key) {
			result[key] = value;
		}
	}
	return result;
}
