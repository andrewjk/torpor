export default function endOfTemplateString(content: string, start: number): number {
	// TODO: Recursively skip strings and comments inside the interpolated JS
	let level = 0;
	for (let j = start + 1; j < content.length; j++) {
		if (content[j] === "`" && content[j - 1] !== "\\" && level === 0) {
			return j;
		} else if (content[j] === "{" && (level > 0 || content[j - 1] === "$")) {
			level += 1;
		} else if (content[j] === "}" && level > 0) {
			level -= 1;
		}
	}
	return content.length;
}
