export default function printHtml(html: string): string {
	let lines = html
		.replaceAll("<", "\n<")
		.replaceAll(">", ">\n")
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => !!l);

	let indent = 0;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].startsWith("<!--")) {
			lines[i] = " ".repeat(indent * 2) + lines[i];
		} else if (lines[i].startsWith("</")) {
			indent -= 1;
			lines[i] = " ".repeat(indent * 2) + lines[i];
		} else if (lines[i].startsWith("<") && !lines[i].endsWith("/>")) {
			lines[i] = " ".repeat(indent * 2) + lines[i];
			indent += 1;
		} else {
			lines[i] = " ".repeat(indent * 2) + lines[i];
		}
	}

	return lines.join("\n");
}
