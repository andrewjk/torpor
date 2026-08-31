import type TextNode from "../../types/nodes/TextNode";
import { skipStringOrComment } from "../../utils/codeScanner";
import type BuildServerStatus from "./BuildServerStatus";

export default function buildServerTextNode(node: TextNode, status: BuildServerStatus): void {
	let content = node.content || "";

	if (!status.preserveWhitespace) {
		// Replace all spaces with a single space, both to save space and to remove
		// newlines from generated JS strings
		content = content.replaceAll(/\s+/g, " ");
	}

	// TODO: Move all of this logic into parse, for text nodes and attribute values
	let level = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		if (char === "{") {
			level++;
			if (level === 1) {
				status.imports.add("t_fmt");
				status.output += "${t_fmt(";
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
