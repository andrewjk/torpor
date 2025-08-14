import {
	ANCHOR_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_START_COMMENT,
} from "../../types/comments";
import { type ElementNode } from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../../utils/Builder";
import trimMatched from "../../utils/trimMatched";
import trimQuotes from "../../utils/trimQuotes";
import isFullyReactive from "../utils/isFullyReactive";
import isReactive from "../utils/isReactive";
import nextVarName from "../utils/nextVarName";
import { type BuildServerStatus } from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerComponentNode(
	node: ElementNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	// Surround the entire control statement with bracketed comments, so that we
	// can skip to the end to set the anchor node when hydrating
	status.output += HYDRATION_START_COMMENT;

	if (status.output) {
		b.append(`t_body += \`${status.output}\`;`);
		status.output = "";
	}

	// Props
	const componentHasProps = node.attributes.length; // || root;
	const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
	if (componentHasProps) {
		// TODO: defaults etc props
		b.append(`const ${propsName}: any = {};`);
		for (let { name, value } of node.attributes) {
			if (name.startsWith("{") && name.endsWith("}")) {
				// It's a shortcut attribute
				// It could be e.g. {width} or it could be {$state.width}, but
				// in either case we set the value of the width property
				name = name.substring(1, name.length - 1);
				const propName = name.split(".").at(-1);
				b.append(`${propsName}["${propName}"] = ${name};`);
			} else if ((name === "class" || name === ":class") && value != null) {
				// NOTE: :class is obsolete, but let's keep it for a version or two
				status.imports.add("t_class");
				if (isFullyReactive(value)) {
					value = value.substring(1, value.length - 1);
				}
				const params = [value];
				if (node.scopeStyles) {
					params.push(`"torp-${status.styleHash}"`);
				}
				b.append(`${propsName}["class"] = t_class(${params.join(", ")});`);
			} else if ((name === "style" || name === ":style") && value != null) {
				// NOTE: :style is obsolete, but let's keep it for a version or two
				status.imports.add("t_style");
				if (isFullyReactive(value)) {
					value = value.substring(1, value.length - 1);
				}
				b.append(`${propsName}["style"] = t_style(${value});`);
			} else if (value != null) {
				let fullyReactive = isFullyReactive(value);
				let partlyReactive = isReactive(value);
				if (fullyReactive) {
					value = value.substring(1, value.length - 1);
				} else if (partlyReactive) {
					value = `\`${trimQuotes(value).replaceAll("{", "${")}\``;
				}
				b.append(`${propsName}["${name}"] = ${value};`);
			} else {
				b.append(`${propsName}["${name}"] = true;`);
			}
		}
		// NOTE: Not sure if this is needed
		/*
		if (root) {
			b.append(`
			if ($props) {
				const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];
				for (let name of Object.keys($props)) {
					if (!name.startsWith("$") && !propNames.includes(name)) {
						${propsName}[name] = $props[name];
					}
				}
			}`);
		}
		*/
	}

	// Slots
	const componentHasSlots = node.children.length;
	const slotsName = componentHasSlots ? nextVarName("slots", status) : "undefined";
	if (componentHasSlots) {
		b.append(`const ${slotsName}: Record<string, ServerSlotRender> = {};`);
		for (let slot of node.children) {
			if (isSpecialNode(slot)) {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";
				const slotParams = [
					"// @ts-ignore\n$sprops?: Record<PropertyKey, any>",
					"// @ts-ignore\n$context?: Record<PropertyKey, any>",
				];
				b.append(`${slotsName}["${slotName}"] = (\n${slotParams.join(",\n")}\n) => {`);
				b.append(`let t_body = "";`);

				for (let child of slot.children) {
					buildServerNode(child, status, b);
				}

				if (status.output) {
					b.append(`t_body += \`${status.output}\`;`);
					status.output = "";
				}

				b.append("return t_body;");
				b.append(`}`);
			}
		}
	}

	let componentName = node.tagName;
	if (componentName === ":component") {
		let selfAttribute = node.attributes.find((a) => a.name === "self");
		if (selfAttribute && selfAttribute.value) {
			componentName = trimMatched(selfAttribute.value, "{", "}");
		}
	}

	// Render the component
	let renderParams = `${propsName}, $context`;
	if (slotsName !== "undefined") {
		renderParams += `, ${slotsName}`;
	}
	b.append("");
	const componentResult = nextVarName("comp", status);
	b.append(`const ${componentResult} = ${componentName}(${renderParams});`);
	b.append(`t_body += ${componentResult}.body;`);
	b.append(`t_head += ${componentResult}.head;`);

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}
