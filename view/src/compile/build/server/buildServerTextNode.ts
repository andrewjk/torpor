import type TextNode from "../../types/nodes/TextNode";
import Builder from "../../utils/Builder";
import type BuildServerStatus from "./BuildServerStatus";

export default function buildServerTextNode(node: TextNode, status: BuildServerStatus, b: Builder) {
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
		const nextChar = content[i + 1];
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
			if (char === "/" && nextChar === "/") {
				// Skip one-line comments
				let start = i;
				i = content.indexOf("\n", i);
				status.output += escapeHtml(content.substring(start, i + 1));
				continue;
			} else if (char === "/" && nextChar === "*") {
				// Skip block comments
				let start = i;
				i = content.indexOf("*/", i) + 1;
				status.output += escapeHtml(content.substring(start, i + 1));
				continue;
			} else if (char === '"' || char === "'") {
				// Skip string contents
				let start = i;
				for (let j = i + 1; j < content.length; j++) {
					if (content[j] === char && content[j - 1] !== "\\") {
						i = j;
						status.output += escapeHtml(content.substring(start, i + 1));
						break;
					}
				}
				continue;
			} else if (char === "`") {
				// Skip possibly interpolated string contents
				// TODO: Recursively skip strings inside the interpolated JS
				let start = i;
				let level2 = 0;
				for (let j = i + 1; j < content.length; j++) {
					if (content[j] === char && content[j - 1] !== "\\" && level2 === 0) {
						i = j;
						status.output += escapeHtml(content.substring(start, i + 1));
						break;
					} else if (content[j] === "{" && (level2 > 0 || content[j - 1] === "$")) {
						level2 += 1;
					} else if (content[j] === "}" && level2 > 0) {
						level2 -= 1;
					}
				}
				continue;
			}
		}
		status.output += char;
	}
}

// Escape HTML in comments and strings on the server, so that we don't output unintended tags etc
// This doesn't need to be done on the client, where we will be setting textContent
function escapeHtml(text: string) {
	return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
