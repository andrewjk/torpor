import { type ElementNode } from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import trimQuotes from "../../utils/trimQuotes";
import voidTags from "../../utils/voidTags";
import isFullyReactive from "../utils/isFullyReactive";
import isReactive from "../utils/isReactive";
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
	if (tagName === ":element") {
		let selfAttribute = node.attributes.find((a) => a.name === "self");
		if (selfAttribute) {
			tagName = `$${selfAttribute.value}`;
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
	for (let { name, value } of node.attributes) {
		if (name === "self" && node.tagName === ":element") {
			// Ignore this special attribute
		} else if (name.startsWith("on") || name.startsWith(":on")) {
			// No events on the server
		} else if (name.startsWith(":transition") && value) {
			// No animation on the server, but we do need to set the attributes
			// from the first keyframe
			// HACK: use a regex instead maybe?
			value = value.substring(1, value.length - 1).trim();
			value = value.split(",")[0].trim();
			if (value.startsWith("[")) {
				value = value.substring(1);
			} else {
				value = value + "[0]";
			}
			attributes.push(
				`style="\${Object.entries(${value}).map(([k, v]) => \`$\{k}: $\{v}\`).join("; ")}"`,
			);
		} else if (name.startsWith("{") && name.endsWith("}")) {
			// It's a shortcut attribute
			// It could be e.g. {width} or it could be {$state.width}, but
			// in either case we set the value of the width property
			name = name.substring(1, name.length - 1);
			const propName = name.split(".").at(-1);
			status.imports.add("t_attr");
			attributes.push(`${propName}="\${t_attr(${name})}"`);
		} else if (value != null && isFullyReactive(value)) {
			// It's a reactive attribute
			value = value.substring(1, value.length - 1);

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
			} else if (name === "class" || name === ":class") {
				// NOTE: :class is obsolete, but let's keep it for a version or two
				status.imports.add("t_class");
				let params = [value];
				if (node.scopeStyles) {
					params.push(`"torp-${status.styleHash}"`);
					needsClass = false;
				}
				attributes.push(`class="\${t_class(${params.join(", ")})}"`);
			} else if (name === "style" || name === ":style") {
				// NOTE: :style is obsolete, but let's keep it for a version or two
				status.imports.add("t_style");
				attributes.push(`style="\${t_style(${value})}"`);
			} else {
				// Only set the attribute if the value is truthy
				// e.g. `... ${className ? `class="${className}"` : ''} ...`
				status.imports.add("t_attr");
				attributes.push(`\${${value} ? \`${name}="\${t_attr(${value})}"\` : ''}`);
			}
		} else if (value != null && isReactive(value)) {
			// TODO: Match braces, don't replace braces inside code
			status.imports.add("t_attr");
			attributes.push(
				`${name}="${trimQuotes(value).replaceAll("{", "${t_attr(").replaceAll("}", ")}")}"`,
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
