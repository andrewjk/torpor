import type ElementNode from "../../../types/nodes/ElementNode";
import isSpecialNode from "../../../types/nodes/isSpecialNode";
import Builder from "../../Builder";
import { trimQuotes } from "../../utils";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";
import { nextVarName } from "./buildServerUtils";

export default function buildServerComponentNode(
	node: ElementNode,
	status: BuildServerStatus,
	b: Builder,
) {
	if (status.output) {
		b.append(`$output += \`${status.output}\`;`);
		status.output = "";
	}

	// Props
	const componentHasProps = node.attributes.length; // || root;
	const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
	if (componentHasProps) {
		// TODO: defaults etc props
		b.append(`const ${propsName} = {};`);
		for (let { name, value } of node.attributes) {
			if (name.startsWith("{") && name.endsWith("}")) {
				name = name.substring(1, name.length - 1);
				b.append(`${propsName}["${name}"] = ${name}`);
			} else {
				let reactive = value.startsWith("{") && value.endsWith("}");
				if (reactive) {
					value = value.substring(1, value.length - 1);
				}
				if (name === "class") {
					// TODO: How to handle dynamic classes etc
					// Probably just compile down to a string?
					b.append(`"${trimQuotes(value)} tera-${status.styleHash}"`);
				}
				b.append(`${propsName}["${name}"] = ${value || "true"};`);
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
		b.append(`const ${slotsName} = {};`);
		for (let slot of node.children) {
			if (isSpecialNode(slot)) {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute ? trimQuotes(nameAttribute.value) : "_";
				b.append(`${slotsName}["${slotName}"] = ($sprops, $context) => {`);
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

	// Render the component
	let renderParams = `${propsName}, $context`;
	if (slotsName !== "undefined") {
		renderParams += `, ${slotsName}`;
	}
	b.append("");
	b.append(`$output += ${node.tagName}.render(${renderParams})`);
}
