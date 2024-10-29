import type ParseStatus from "./ParseStatus";
import parseElement from "./parseElement";
import accept from "./utils/accept";
import addError from "./utils/addError";

export default function parseMarkup(status: ParseStatus, source: string) {
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
			const start = status.i;
			const element = parseElement(status);
			if (current.markup === undefined) {
				current.markup = element;
			} else if (!element.tagName.startsWith("/")) {
				addError(status, `Multiple top-level elements: ${element.tagName}`, start);
			}
		} else {
			status.i += 1;
		}
	}
}
