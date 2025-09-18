import type TextNode from "../types/nodes/TextNode";
import type ParseStatus from "./ParseStatus";
import parseControl from "./parseControl";
import parseElement from "./parseElement";
import accept from "./utils/accept";
import consumeSpace from "./utils/consumeSpace";
import isSpaceChar from "./utils/isSpaceChar";

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
		} else if (isSpaceChar(status.source, status.i)) {
			current.markup ??= { type: "root", children: [] };
			const text: TextNode = { type: "text", content: consumeSpace(status) };
			current.markup.children.push(text);
		} else if (accept("<", status, false)) {
			// Parse the element
			current.markup ??= { type: "root", children: [] };
			const element = parseElement(status);
			current.markup.children.push(element);
		} else if (accept("@", status, false)) {
			// Parse the control
			current.markup ??= { type: "root", children: [] };
			parseControl(status, current.markup);
		} else {
			status.i += 1;
		}
	}
}
