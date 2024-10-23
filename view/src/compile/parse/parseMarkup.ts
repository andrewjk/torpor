import type ParseStatus from "./ParseStatus";
import parseElement from "./parseElement";
import accept from "./utils/accept";
import addError from "./utils/addError";

export default function parseMarkup(status: ParseStatus, source: string) {
	while (status.i < source.length) {
		if (accept("<!--", status)) {
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
			if (status.current.markup === undefined) {
				status.current.markup = parseElement(status);
			} else {
				const start = status.i;
				const element = parseElement(status);
				addError(status, `Multiple top-level elements: ${element.tagName}`, start);
			}
		} else if (accept("}", status, false)) {
			// That's us done
			return;
		} else {
			status.i += 1;
		}
	}
}
