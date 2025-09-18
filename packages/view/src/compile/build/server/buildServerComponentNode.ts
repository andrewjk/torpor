import {
	ANCHOR_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_START_COMMENT,
} from "../../types/comments";
import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import isSpecialNode from "../../utils/isSpecialNode";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import type BuildServerStatus from "./BuildServerStatus";
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
			if (name === "class" && value != null) {
				status.imports.add("t_class");
				const params = [value];
				if (node.scopeStyles) {
					params.push(`"torp-${status.styleHash}"`);
				}
				b.append(`${propsName}["class"] = t_class(${params.join(", ")});`);
			} else if (name === "style" && value != null) {
				status.imports.add("t_style");
				b.append(`${propsName}["style"] = t_style(${value});`);
			} else if (value != null) {
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
			if (isSpecialNode(slot) && slot.tagName === "fill") {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";
				const slotParams = [
					`${slot.hasSlotProps ? "$sprops" : "_$sprops?"}: Record<PropertyKey, any>`,
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
	if (componentName === "@component") {
		let selfAttribute = node.attributes.find((a) => a.name === "self");
		if (selfAttribute && selfAttribute.value && selfAttribute.fullyReactive) {
			componentName = selfAttribute.value;
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
