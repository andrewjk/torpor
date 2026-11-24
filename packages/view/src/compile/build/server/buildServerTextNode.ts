import type TextNode from "../../types/nodes/TextNode";
import { skipStringOrComment } from "../../utils/codeScanner";
import type BuildServerStatus from "./BuildServerStatus";

// HTML raw-text elements: their contents aren't parsed as markup and character
// references aren't decoded, so interpolation must stay unescaped (`<` must
// arrive as `<`, not `&lt;`) — matching the client, which assigns `textContent`.
// `textarea` and `title` are *escapable* raw text (entities are decoded), so
// they keep the escaping formatter.
const RAW_TEXT_ELEMENTS = new Set(["script", "style", "xmp", "iframe", "noembed", "noframes"]);

export default function buildServerTextNode(node: TextNode, status: BuildServerStatus): void {
	let content = node.content || "";

	if (!status.preserveWhitespace) {
		// Replace all spaces with a single space, both to save space and to remove
		// newlines from generated JS strings
		content = content.replaceAll(/\s+/g, " ");
	}

	// Text inside a raw-text element is emitted unescaped; everywhere else it
	// is HTML-escaped by the server's `t_fmt`.
	const parentTag = status.elementStack[status.elementStack.length - 1];
	const formatter =
		parentTag !== undefined && RAW_TEXT_ELEMENTS.has(parentTag.toLowerCase())
			? "t_fmt_raw"
			: "t_fmt";

	// TODO: Move all of this logic into parse, for text nodes and attribute values
	let level = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		if (char === "{") {
			level++;
			if (level === 1) {
				status.imports.add(formatter);
				status.output += "${" + formatter + "(";
				continue;
			}
		} else if (char === "}") {
			level--;
			if (level === 0) {
				status.output += ")";
			}
		} else if (char === "`" && level === 0) {
			// Escape backticks outside of braces, as they will be within a backtick string
			status.output += "\\";
		} else if (level > 0) {
			const skipped = skipStringOrComment(content, i);
			if (skipped !== -1) {
				// Copy strings, template strings, comments and regex literals
				// into the output as-is. HTML escaping is done at runtime by the
				// server's t_fmt, so that literals keep their original meaning.
				status.output += content.substring(i, skipped);
				i = skipped - 1;
				continue;
			}
		}
		status.output += char;
	}
}
