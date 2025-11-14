import type TextNode from "../../types/nodes/TextNode";
import endOfString from "../../utils/endOfString";
import endOfTemplateString from "../../utils/endOfTemplateString";
import type BuildStatus from "./BuildStatus";
import stashRunWithOffsets from "./stashRunWithOffsets";

export default function buildTextNode(node: TextNode, status: BuildStatus): void {
	let fragment = status.fragmentStack.at(-1)?.fragment;
	if (!fragment) return; // probably in @head...

	let content = node.content || "";

	if (!status.preserveWhitespace) {
		// Replace all spaces with a single space, both to save space and to remove
		// newlines from generated JS strings
		content = content.replaceAll(/\s+/g, " ");
	}

	// TODO: Should we be parsing out the spans here? Like we do with
	// attributes? And should we merge this with the attributes logic?
	let textContent = "";
	let reactiveCount = 0;
	let reactiveStart = 0;
	let offsets: number[] = [];
	let lengths: number[] = [];
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
				reactiveStart = textContent.length;
				offsets.push(reactiveStart);
				continue;
			}
		} else if (char === "}") {
			level--;
			if (level === 0) {
				lengths.push(textContent.length - reactiveStart);
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
				i = endOfString(char, content, i);
				textContent += content.substring(start, i + 1);
				continue;
			} else if (char === "`") {
				// Skip interpolated string contents
				let start = i;
				i = endOfTemplateString(content, i);
				textContent += content.substring(start, i + 1);
				continue;
			}
		}
		textContent += content[i];
	}

	// Only need to build if there is any reactive content, otherwise the plain
	// text content will be output in fragment text
	if (maxLevel) {
		let offsetChange = 0;
		if (reactiveCount === 1 && content.startsWith("{") && content.endsWith("}")) {
			textContent = textContent.substring(2, textContent.length - 1);
			offsetChange = -2;
		} else {
			textContent = `\`${textContent}\``;
			offsetChange = 1;
		}

		status.imports.add("t_fmt");
		offsets.map((_, i) => (offsets[i] += offsetChange));

		stashRunWithOffsets(
			fragment,
			`${node.varName}.textContent = `,
			textContent,
			";",
			node.spans,
			offsets,
			lengths,
			status,
		);
	}
}
