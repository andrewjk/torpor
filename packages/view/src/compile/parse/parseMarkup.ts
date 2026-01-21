import type CommentNode from "../types/nodes/CommentNode";
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
			const start = status.i;
			status.i = status.source.indexOf("-->", status.i) + 3;
			const text: CommentNode = {
				type: "comment",
				commentType: "html",
				content: status.source.substring(start, status.i - 3),
			};
			current.markup ??= { type: "root", children: [] };
			current.markup.children.push(text);
		} else if (accept("@//", status)) {
			// Swallow one-line comments
			const start = status.i;
			status.i = status.source.indexOf("\n", status.i) + 1;
			const text: CommentNode = {
				type: "comment",
				commentType: "line",
				content: status.source.substring(start, status.i - 1),
			};
			current.markup ??= { type: "root", children: [] };
			current.markup.children.push(text);
		} else if (accept("@/*", status)) {
			// Swallow block comments
			const start = status.i;
			status.i = status.source.indexOf("*/", status.i) + 2;
			const text: CommentNode = {
				type: "comment",
				commentType: "block",
				content: status.source.substring(start, status.i - 2),
			};
			current.markup ??= { type: "root", children: [] };
			current.markup.children.push(text);
		} else if (isSpaceChar(status.source, status.i)) {
			current.markup ??= { type: "root", children: [] };
			const space = consumeSpace(status);
			const text: TextNode = {
				type: "text",
				content: space,
				spans: [],
			};
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
