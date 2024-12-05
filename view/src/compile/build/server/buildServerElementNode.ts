import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import trimQuotes from "../../utils/trimQuotes";
import voidTags from "../../utils/voidTags";
import isFullyReactive from "../utils/isFullyReactive";
import isReactive from "../utils/isReactive";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerElementNode(
	node: ElementNode,
	status: BuildServerStatus,
	b: Builder,
) {
	let attributes = buildElementAttributes(node, status, b);
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

function buildElementAttributes(node: ElementNode, status: BuildServerStatus, b: Builder) {
	let attributes: string[] = [];
	let classIndex = -1;
	for (let { name, value } of node.attributes) {
		if (name === "self" && node.tagName === ":element") {
			// Ignore this special attribute
		} else if (name.startsWith("on")) {
			// No events on the server
		} else if (name.startsWith("transition") && value) {
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
			name = name.substring(1, name.length - 1);
			status.imports.add("t_attr");
			attributes.push(`${name}="\${t_attr(${name})}"`);
		} else if (value != null && isFullyReactive(value)) {
			// It's a reactive attribute
			value = value.substring(1, value.length - 1);

			if (name.startsWith("bind:")) {
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
				const propName = name.substring(5);
				attributes.push(`${propName}="\${${valueOrDefault}}"`);
			} else if (name.startsWith("class:")) {
				const className = name.substring(6);
				if (classIndex === -1) {
					classIndex = attributes.length;
					attributes.push(`class="\${${value} ? "${className}" : ""}"`);
				} else {
					const classAttribute = attributes[classIndex];
					attributes[classIndex] =
						classAttribute.substring(0, classAttribute.length - 1) +
						` \${${value} ? "${className}" : ""}"`;
				}
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
		} else if (value != null) {
			// Just set the attribute
			// TODO: Probably check if it's a boolean attribute e.g. disabled
			attributes.push(`${name}="${trimQuotes(value).replaceAll('"', "&quot;")}"`);
		} else {
			attributes.push(`${name}`);
		}
	}
	return attributes.join(" ");
}
