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
import flushOutput from "./flushOutput";

export default function buildServerComponentNode(
	node: ElementNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	// Surround the entire control statement with bracketed comments, so that we
	// can skip to the end to set the anchor node when hydrating
	status.output += HYDRATION_START_COMMENT;

	flushOutput(status, b);

	// Props
	const componentHasProps = node.attributes.length; // || root;
	const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
	if (componentHasProps) {
		// TODO: defaults etc props

		// Gather props, and set them all at once
		let props: { name: string; value: string }[] = [];

		for (let { name, value } of node.attributes) {
			// No binding on the server
			if (name.startsWith("&")) {
				name = name.substring(1);
			}

			if (name === "class" && value != null) {
				if (node.scopeStyles) {
					value = `[${value}, "torp-${status.styleHash}"]`;
				}
				props.push({ name, value });
			} else if (name === "style" && value != null) {
				props.push({ name, value });
			} else if (value != null) {
				props.push({ name, value });
			} else {
				props.push({ name, value: "true" });
			}
		}

		// Set the props that we gathered
		b.append(`const ${propsName} = {`);
		for (let p of props) {
			b.append(p.name ? `${p.name}: ${p.value},` : `${p.value},`);
		}
		b.append("};");

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
			if (isSpecialNode(slot) && (slot.tagName === "fill" || slot.tagName === "filldef")) {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";
				const slotParams = [
					// NOTE: The $slot param is only declared with its real name
					// when the fill reads it (hasSlotProps), otherwise it would
					// be reported as unused
					slot.hasSlotProps
						? "$slot: Record<PropertyKey, any>"
						: "_$slot?: Record<PropertyKey, any>",
					"// @ts-ignore\n// eslint-disable-next-line no-unused-vars\n$context?: Record<PropertyKey, any>",
				];
				// NOTE: The @ts-ignore suppresses the assignability error from
				// the required $slot param, which is not compatible with the
				// optional $slot param of the ServerSlotRender type
				b.append(
					`${slot.hasSlotProps ? "// @ts-ignore\n" : ""}${slotsName}["${slotName}"] = (\n${slotParams.join(",\n")}\n) => {`,
				);
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
	const componentResult = nextVarName("comp", status);
	b.append(`const ${componentResult} = ${componentName}(${renderParams});`);
	b.append(`${status.inHead ? "t_head" : "t_body"} += ${componentResult}.body;`);
	b.append(`t_head += ${componentResult}.head;`);

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}
