import type TextNode from "../../types/nodes/TextNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import buildRun from "./buildRun";

export default function buildTextNode(
	node: TextNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
) {
	let content = node.content || "";

	if (!status.preserveWhitespace) {
		// Replace all spaces with a single space, both to save space and to remove
		// newlines from generated JS strings
		content = content.replaceAll(/\s+/g, " ");
	}

	// TODO: Move all of this logic into parse, for text nodes and attribute values
	let textContent = "";
	let reactiveCount = 0;
	let level = 0;
	let maxLevel = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		const nextChar = content[i + 1];
		if (char === "{") {
			level++;
			maxLevel = Math.max(level, maxLevel);
			if (level === 1) {
				reactiveCount += 1;
				textContent += "${t_fmt(";
				continue;
			}
		} else if (char === "}") {
			level--;
			if (level === 0) {
				textContent += ")";
			}
		} else if (char === "`" && level === 0) {
			// Escape backticks outside of braces, as they will be within a backtick string
			textContent += "\\";
		} else if (level > 0) {
			if (char === "/" && nextChar === "/") {
				// Skip one-line comments
				let start = i;
				i = content.indexOf("\n", i);
				textContent += content.substring(start, i + 1);
				continue;
			} else if (char === "/" && nextChar === "*") {
				// Skip block comments
				let start = i;
				i = content.indexOf("*/", i) + 1;
				textContent += content.substring(start, i + 1);
				continue;
			} else if (char === '"' || char === "'") {
				// Skip string contents
				let start = i;
				for (let j = i + 1; j < content.length; j++) {
					if (content[j] === char && content[j - 1] !== "\\") {
						i = j;
						textContent += content.substring(start, i + 1);
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
						textContent += content.substring(start, i + 1);
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
		textContent += content[i];
	}

	// TODO: Only need to build if this is not 0
	if (maxLevel) {
		if (reactiveCount === 1 && content.startsWith("{") && content.endsWith("}")) {
			textContent = textContent.substring(2, textContent.length - 1);
		} else {
			textContent = `\`${textContent}\``;
		}

		status.imports.add("t_fmt");
		buildRun("setTextContent", `${node.varName}.textContent = ${textContent};`, status, b);
	}
}
