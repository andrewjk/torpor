import {
	ANCHOR_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_START_COMMENT,
} from "../../types/comments";
import { type ElementNode } from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../../utils/Builder";
import trimQuotes from "../../utils/trimQuotes";
import isFullyReactive from "../utils/isFullyReactive";
import isReactive from "../utils/isReactive";
import nextVarName from "../utils/nextVarName";
import { type BuildServerStatus } from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerSlotNode(
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

	// If there's a slot, build that, otherwise build the default nodes
	let slotName = node.attributes.find((a) => a.name === "name")?.value;
	slotName = slotName ? trimQuotes(slotName) : "_";

	// Slot props
	const propsName = nextVarName("sprops", status);
	const slotAttributes = node.attributes.filter((a) => a.name !== "name");
	const slotHasProps = slotAttributes.length;
	if (slotHasProps) {
		// TODO: defaults etc props
		b.append(`const ${propsName}: any = {};`);
		for (let { name, value } of slotAttributes) {
			if (name.startsWith("{") && name.endsWith("}")) {
				// It's a shortcut attribute
				// It could be e.g. {width} or it could be {$state.width}, but
				// in either case we set the value of the width property
				name = name.substring(1, name.length - 1);
				const propName = name.split(".").at(-1);
				b.append(`${propsName}["${propName}"] = ${name};`);
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
	}

	b.append(`if ($slots && $slots["${slotName}"]) {`);
	b.append(`t_body += $slots["${slotName}"](${slotHasProps ? propsName : "undefined"}, $context);`);
	////const slotResult = nextVarName("comp", status);
	////b.append(
	////	`const ${slotResult} = $slots["${slotName}"](${slotHasProps ? propsName : "undefined"}, $context);`,
	////);
	////b.append(`t_body += ${slotResult}.body;`);
	////b.append(`t_head += ${slotResult}.head;`);

	// TODO: Not if there's only a single space node -- maybe check in parse
	const fill = node.children.find((c) => isSpecialNode(c) && c.tagName === ":fill");
	if (fill && isSpecialNode(fill) && fill.children.length) {
		b.append(`} else {`);

		for (let child of fill.children) {
			buildServerNode(child, status, b);
		}

		if (status.output) {
			b.append(`t_body += \`${status.output}\`;`);
			status.output = "";
		}
	}

	b.append(`}`);

	// End the control statement
	status.output += HYDRATION_END_COMMENT;

	// Add the anchor node
	status.output += ANCHOR_COMMENT;
}
