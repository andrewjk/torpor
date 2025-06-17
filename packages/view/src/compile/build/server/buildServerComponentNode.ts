import { ANCHOR_COMMENT } from "../../types/comments";
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
	if (status.output) {
		b.append(`$output += \`${status.output}\`;`);
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
			} else if (name === ":class" && value != null && isFullyReactive(value)) {
				status.imports.add("t_class");
				value = value.substring(1, value.length - 1);
				if (node.scopeStyles) {
					value += `, "torp-${status.styleHash}"`;
				}
				b.append(`${propsName}["class"] = t_class(${value});`);
			} else if (name === ":style" && value != null && isFullyReactive(value)) {
				status.imports.add("t_style");
				value = value.substring(1, value.length - 1);
				b.append(`${propsName}["style"] = t_style(${value});`);
			} else if (value != null) {
				let fullyReactive = isFullyReactive(value);
				let partlyReactive = isReactive(value);
				if (fullyReactive) {
					value = value.substring(1, value.length - 1);
				} else if (partlyReactive) {
					value = `\`${trimQuotes(value).replaceAll("{", "${")}\``;
				}
				if (name === "class") {
					// TODO: How to handle dynamic classes etc
					// Probably just compile down to a string?
					b.append(`"${trimQuotes(value)} torp-${status.styleHash}"`);
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
				b.append(`let $output = "";`);

				for (let child of slot.children) {
					buildServerNode(child, status, b);
				}

				if (status.output) {
					b.append(`$output += \`${status.output}\`;`);
					status.output = "";
				}

				b.append("return $output;");
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
	b.append(`$output += ${componentName}(${renderParams})`);

	// If we're using a @replace to update a :component, we need another anchor comment
	if (node.tagName === ":component") {
		status.output += ANCHOR_COMMENT;
	}
}
