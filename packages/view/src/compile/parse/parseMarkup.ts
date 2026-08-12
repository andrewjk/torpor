import type CommentNode from "../types/nodes/CommentNode";
import type RootNode from "../types/nodes/RootNode";
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

	parseMarkupInto(status, source, (root) => (current.markup ??= root));
}

/**
 * Parses markup into a root node, letting callers choose where the resulting
 * RootNode is stored (e.g. a component's `markup` or its `error` block).
 *
 * @param status The parse status
 * @param source The full source code
 * @param setRoot Called with a fresh root node the first time content is
 *   parsed; subsequent content is appended to the same node.
 */
export function parseMarkupInto(
	status: ParseStatus,
	source: string,
	setRoot: (root: RootNode) => void,
): void {
	let root: RootNode | null = null;
	const getRoot = () => (root ??= { type: "root", children: [] });

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
			setRoot(getRoot());
			getRoot().children.push(text);
		} else if (accept("@//", status)) {
			// Swallow one-line comments
			const start = status.i;
			status.i = status.source.indexOf("\n", status.i) + 1;
			const text: CommentNode = {
				type: "comment",
				commentType: "line",
				content: status.source.substring(start, status.i - 1),
			};
			setRoot(getRoot());
			getRoot().children.push(text);
		} else if (accept("@/*", status)) {
			// Swallow block comments
			const start = status.i;
			status.i = status.source.indexOf("*/", status.i) + 2;
			const text: CommentNode = {
				type: "comment",
				commentType: "block",
				content: status.source.substring(start, status.i - 2),
			};
			setRoot(getRoot());
			getRoot().children.push(text);
		} else if (isSpaceChar(status.source, status.i)) {
			setRoot(getRoot());
			const space = consumeSpace(status);
			const text: TextNode = {
				type: "text",
				content: space,
				spans: [],
			};
			getRoot().children.push(text);
		} else if (accept("<", status, false)) {
			// Parse the element
			setRoot(getRoot());
			const element = parseElement(status);
			getRoot().children.push(element);
		} else if (accept("@", status, false)) {
			// Parse the control
			setRoot(getRoot());
			parseControl(status, getRoot());
		} else {
			status.i += 1;
		}
	}
}
