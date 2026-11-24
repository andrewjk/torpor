import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import { escapeTemplateText } from "../../utils/escapeTemplateText";
import isRawTextTag from "../../utils/rawTextTags";
import trimQuotes from "../../utils/trimQuotes";
import voidTags from "../../utils/voidTags";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerElementNode(
	node: ElementNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	let attributes = buildElementAttributes(node, status);
	if (attributes.length) {
		attributes = " " + attributes;
	}

	let tagName = node.tagName;
	if (tagName === "@element") {
		let selfAttribute = node.attributes.find((a) => a.name === "self");
		if (selfAttribute) {
			tagName = `$\{${selfAttribute.value}}`;
		}
	}

	// NOTE: Only void tags can be self-closed in HTML, although we allow it in
	// templates and auto-expand it here
	status.output += `<${tagName}${attributes}>`;
	if (!voidTags.includes(tagName)) {
		const oldPreserveWhitespace = status.preserveWhitespace;
		status.preserveWhitespace = ["pre", "code"].includes(tagName) || isRawTextTag(tagName);
		// `@element` has a runtime tag expression, which we can't analyze
		if (!tagName.startsWith("@")) status.elementStack.push(tagName);
		for (let child of node.children) {
			buildServerNode(child, status, b);
		}
		if (!tagName.startsWith("@")) status.elementStack.pop();
		status.preserveWhitespace = oldPreserveWhitespace;
		status.output += `</${tagName}>`;
	}
}

function buildElementAttributes(node: ElementNode, status: BuildServerStatus) {
	// Elements in a @head block never get the scoped class name
	let needsClass = node.scopeStyles && !status.inHead;
	let attributes: string[] = [];
	for (let { name, value, reactive, fullyReactive } of node.attributes) {
		if (name === "self" && node.tagName === "@element") {
			// Ignore this special attribute
		} else if (name === "&ref") {
			// No elements on the server
		} else if (name.startsWith("on") || name.startsWith(":on")) {
			// No events on the server
		} else if (name.startsWith("transition") && value) {
			// TODO: No animation on the server, but we do need to set the
			// attributes from the first keyframe
			// HACK: use a regex instead maybe?
			//value = value.split(",")[0].trim();
			//if (value.startsWith("[")) {
			//	value = value.substring(1);
			//} else {
			//	value = value + "[0]";
			//}
			//attributes.push(
			//	`style="\${Object.entries(${value}).map(([k, v]) => \`$\{k}: $\{v}\`).join("; ")}"`,
			//);
		} else if (value != null && fullyReactive) {
			if (name === "&value" || name === "&checked" || name === "&group") {
				// <select multiple> doesn't use a value attribute; the client
				// sets option.selected during hydration
				if (
					name === "&value" &&
					node.tagName === "select" &&
					node.attributes.some((a) => a.name === "multiple")
				) {
					continue;
				}
				let defaultValue = "";
				let typeAttribute = node.attributes.find((a) => a.name === "type");
				if (typeAttribute && typeAttribute.value) {
					switch (trimQuotes(typeAttribute.value)) {
						case "number": {
							defaultValue = "0";
							break;
						}
						case "checkbox": {
							defaultValue = "false";
							break;
						}
					}
				}
				if (!defaultValue) {
					defaultValue = '""';
				}
				// Always escape the bound value: a number or checkbox input
				// can still be bound to a string at runtime
				status.imports.add("t_attr");
				let valueOrDefault = `t_attr(${value}) || ${defaultValue}`;
				const propName = name.substring(1);
				attributes.push(`${propName}="\${${valueOrDefault}}"`);
			} else if (name === "class") {
				status.imports.add("t_class");
				let params = value;
				if (node.scopeStyles && !status.inHead) {
					params = `${value}, "torp-${status.styleHash}"`;
					needsClass = false;
				}
				// Only set the attribute if the value is truthy. The ssr
				// `t_class` returns the whole `class="..."` attribute (or "")
				attributes.push(`\${t_class(${params})}`);
			} else if (name === "style") {
				// Only set the attribute if the value is truthy. The ssr
				// `t_style` returns the whole `style="..."` attribute (or "")
				status.imports.add("t_style");
				attributes.push(`\${t_style(${value})}`);
			} else {
				// `t_attr_if` drops the attribute for null/undefined/false,
				// matching the client-side `t_attribute`: an empty string or 0
				// still renders, e.g. the meaningful `alt=""`
				status.imports.add("t_attr_if");
				attributes.push(`\${t_attr_if("${name}", ${value})}`);
			}
		} else if (value != null && reactive) {
			// TODO: Match braces, don't replace braces inside code
			status.imports.add("t_attr");
			attributes.push(
				`${name}="${trimQuotes(value).replaceAll("{", "${t_attr(").replaceAll("}", ")}")}"`,
			);
		} else if (name === "class" && node.scopeStyles && !status.inHead) {
			value = value
				? `"${trimQuotes(value)} torp-${status.styleHash}"`
				: `"torp-${status.styleHash}"`;
			attributes.push(
				escapeTemplateText(`${name}="${trimQuotes(value).replaceAll('"', "&quot;")}"`),
			);
			needsClass = false;
		} else if (value != null) {
			// Just set the attribute
			// TODO: Probably check if it's a boolean attribute e.g. disabled
			attributes.push(
				escapeTemplateText(`${name}="${trimQuotes(value).replaceAll('"', "&quot;")}"`),
			);
		} else {
			attributes.push(`${name}`);
		}
	}
	if (needsClass) {
		attributes.push(`class="torp-${status.styleHash}"`);
	}
	return attributes.join(" ");
}
