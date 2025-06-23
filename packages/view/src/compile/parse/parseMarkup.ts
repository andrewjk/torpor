import { type ParseStatus } from "./ParseStatus";
import parseElement from "./parseElement";
import accept from "./utils/accept";

export default function parseMarkup(status: ParseStatus, source: string): void {
	const current = status.components.at(-1);
	if (!current) return;

	while (status.i < source.length) {
		if (accept("}", status, false)) {
			// That's the rendering done
			return;
		} else if (accept("<!--", status)) {
			// It's a comment, swallow it
			status.i = status.source.indexOf("-->", status.i) + 3;
		} else if (accept("@//", status)) {
			// Swallow one-line comments
			status.i = status.source.indexOf("\n", status.i) + 1;
		} else if (accept("@/*", status)) {
			// Swallow block comments
			status.i = status.source.indexOf("*/", status.i) + 2;
		} else if (accept("<", status, false)) {
			// Parse the element
			const element = parseElement(status);
			current.markup ??= { type: "root", children: [] };
			current.markup.children.push(element);
		} else {
			status.i += 1;
		}
	}
}
