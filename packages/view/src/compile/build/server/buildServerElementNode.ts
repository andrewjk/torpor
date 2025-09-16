import { type ElementNode } from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import trimQuotes from "../../utils/trimQuotes";
import voidTags from "../../utils/voidTags";
import { type BuildServerStatus } from "./BuildServerStatus";
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
		status.preserveWhitespace = ["pre", "code"].includes(tagName);
		for (let child of node.children) {
			buildServerNode(child, status, b);
		}
		status.preserveWhitespace = oldPreserveWhitespace;
		status.output += `</${tagName}>`;
	}
}

function buildElementAttributes(node: ElementNode, status: BuildServerStatus) {
	let needsClass = node.scopeStyles;
	let attributes: string[] = [];
	for (let { name, value, reactive, fullyReactive } of node.attributes) {
		if (name === "self" && node.tagName === "@element") {
			// Ignore this special attribute
		} else if (name.startsWith("on") || name.startsWith(":on")) {
			// No events on the server
		} else if (name.startsWith("transition") && value) {
			// No animation on the server, but we do need to set the attributes
			// from the first keyframe
			// HACK: use a regex instead maybe?
			value = value.split(",")[0].trim();
			if (value.startsWith("[")) {
				value = value.substring(1);
			} else {
				value = value + "[0]";
			}
			attributes.push(
				`style="\${Object.entries(${value}).map(([k, v]) => \`$\{k}: $\{v}\`).join("; ")}"`,
			);
		} else if (value != null && fullyReactive) {
			if (name === "&ref" || name === "&value" || name === "&checked" || name === "&group") {
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
					status.imports.add("t_attr");
					value = `t_attr(${value})`;
					defaultValue = '""';
				}
				let valueOrDefault = `${value} || ${defaultValue}`;
				const propName = name.substring(1);
				attributes.push(`${propName}="\${${valueOrDefault}}"`);
			} else if (name === "class") {
				status.imports.add("t_class");
				let params = [value];
				if (node.scopeStyles) {
					params.push(`"torp-${status.styleHash}"`);
					needsClass = false;
				}
				attributes.push(`class="\${t_class(${params.join(", ")})}"`);
			} else if (name === "style") {
				status.imports.add("t_style");
				attributes.push(`style="\${t_style(${value})}"`);
			} else {
				// Only set the attribute if the value is truthy
				// e.g. `... ${className ? `class="${className}"` : ''} ...`
				status.imports.add("t_attr");
				attributes.push(`\${${value} ? \`${name}="\${t_attr(${value})}"\` : ''}`);
			}
		} else if (value != null && reactive) {
			// TODO: Match braces, don't replace braces inside code
			status.imports.add("t_attr");
			attributes.push(
				`${name}="${trimQuotes(value).replaceAll("${", "${t_attr(").replaceAll("}", ")}")}"`,
			);
		} else if (name === "class" && node.scopeStyles) {
			value = value
				? `"${trimQuotes(value)} torp-${status.styleHash}"`
				: `"torp-${status.styleHash}"`;
			attributes.push(`${name}="${trimQuotes(value).replaceAll('"', "&quot;")}"`);
			needsClass = false;
		} else if (value != null) {
			// Just set the attribute
			// TODO: Probably check if it's a boolean attribute e.g. disabled
			attributes.push(`${name}="${trimQuotes(value).replaceAll('"', "&quot;")}"`);
		} else {
			attributes.push(`${name}`);
		}
	}
	if (needsClass) {
		attributes.push(`class="torp-${status.styleHash}"`);
	}
	return attributes.join(" ");
}
