import type ControlNode from "../types/nodes/ControlNode";
import type ElementNode from "../types/nodes/ElementNode";
import type ParentNode from "../types/nodes/ParentNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import type TextNode from "../types/nodes/TextNode";
import endOfString from "./endOfString";
import endOfTemplateString from "./endOfTemplateString";
import isParentNode from "./isParentNode";

/**
 * Walks a markup tree and returns every expression string it contains —
 * `@control (...)` statements, reactive attribute values, and `{...}` text
 * interpolations — concatenated. Used for import detection: `$`-primitives
 * used inside markup (e.g. `@if ($pending(() => $state.data))`,
 * `disabled={$pending(...)}`) must be imported, and the script-only scan in
 * `buildCode`/`buildServerCode` doesn't see them.
 *
 * Static attribute values and literal text outside `{...}` are excluded, so a
 * plain string containing e.g. `$pending` does not produce a spurious import.
 */
export default function collectMarkupExpressions(root: TemplateNode): string {
	let out = "";
	const walk = (node: TemplateNode): void => {
		if (node.type === "control") {
			out += (node as ControlNode).statement + "\n";
		}
		if (node.type === "element" || node.type === "component" || node.type === "special") {
			for (const attribute of (node as ElementNode).attributes) {
				if (attribute.reactive && attribute.value !== undefined) {
					out += attribute.value + "\n";
				}
			}
		}
		if (node.type === "text") {
			out += extractInterpolations((node as TextNode).content) + "\n";
		}
		if (isParentNode(node)) {
			for (const child of (node as ParentNode).children) {
				walk(child);
			}
		}
	};
	walk(root);
	return out;
}

/**
 * Extracts the `{expr}` interpolation segments from text content, skipping
 * string literals and comments inside the braces.
 */
function extractInterpolations(content: string): string {
	let out = "";
	let level = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content[i];
		const nextChar = content[i + 1];
		if (char === "{") {
			if (level === 0) out += "\n";
			level++;
			out += char;
		} else if (char === "}") {
			level--;
			out += char;
		} else if (char === "`" && level > 0) {
			const start = i;
			i = endOfTemplateString(content, i);
			out += content.substring(start, i + 1);
		} else if (level > 0 && (char === '"' || char === "'")) {
			const start = i;
			i = endOfString(char, content, i);
			out += content.substring(start, i + 1);
		} else if (level > 0 && char === "/" && nextChar === "/") {
			const start = i;
			i = content.indexOf("\n", i);
			out += content.substring(start, i + 1);
		} else if (level > 0 && char === "/" && nextChar === "*") {
			const start = i;
			i = content.indexOf("*/", i) + 1;
			out += content.substring(start, i + 1);
		} else if (level > 0) {
			out += char;
		}
	}
	return out;
}
