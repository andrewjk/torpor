export default function endOfString(char: string, content: string, start: number): number {
	for (let j = start + 1; j < content.length; j++) {
		if (content[j] === char && content[j - 1] !== "\\") {
			return j;
		}
	}
	return content.length;
}
