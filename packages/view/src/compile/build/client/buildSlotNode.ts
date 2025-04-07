import { type ElementNode } from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../../utils/Builder";
import trimQuotes from "../../utils/trimQuotes";
import isFullyReactive from "../utils/isFullyReactive";
import isReactive from "../utils/isReactive";
import nextVarName from "../utils/nextVarName";
import { type BuildStatus } from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";

export default function buildSlotNode(node: ElementNode, status: BuildStatus, b: Builder) {
	// If there's a slot, build that, otherwise build the default nodes
	let slotName = node.attributes.find((a) => a.name === "name")?.value;
	slotName = slotName ? trimQuotes(slotName) : "_";

	// Slot props
	const propsName = nextVarName("sprops", status);
	const slotAttributes = node.attributes.filter((a) => a.name !== "name");
	const slotHasProps = slotAttributes.length;
	if (slotHasProps) {
		// TODO: defaults etc props
		status.imports.add("$watch");
		b.append(`const ${propsName} = $watch({});`);
		for (let { name, value } of slotAttributes) {
			if (name.startsWith("{") && name.endsWith("}")) {
				// It's a shortcut attribute
				name = name.substring(1, name.length - 1);
				buildRun("setProp", `${propsName}["${name}"] = ${name};`, status, b);
			} else if (value != null) {
				let fullyReactive = isFullyReactive(value);
				let partlyReactive = isReactive(value);
				if (fullyReactive) {
					value = value.substring(1, value.length - 1);
				} else if (partlyReactive) {
					value = `\`${trimQuotes(value).replaceAll("{", "${")}\``;
				}
				const setProp = `${propsName}["${name}"] = ${value}`;
				if (fullyReactive || partlyReactive) {
					buildRun("setProp", `${setProp};`, status, b);
				} else {
					b.append(`${setProp};`);
				}
			} else {
				b.append(`${propsName}["${name}"] = true;`);
			}
		}
	}

	const slotParentName = node.parentName!;
	const slotAnchorName = node.varName!;

	b.append(`if ($slots && $slots["${slotName}"]) {`);
	let params = [slotParentName, slotAnchorName, slotHasProps ? propsName : "undefined", "$context"];
	b.append(`$slots["${slotName}"](${params.join(", ")})`);

	// TODO: Maybe not if there's only a single space node?
	const fill = node.children.find((c) => isSpecialNode(c) && c.tagName === ":fill");
	if (fill && isSpecialNode(fill) && fill.children.length) {
		b.append(`} else {`);

		buildFragment(fill, status, b, slotParentName, slotAnchorName);

		status.fragmentStack.push({
			fragment: fill.fragment,
			path: "0:ch/",
		});
		for (let child of fill.children) {
			buildNode(child, status, b, slotParentName, slotAnchorName);
		}
		status.fragmentStack.pop();

		buildAddFragment(fill, status, b, slotParentName, slotAnchorName);
	}

	b.append(`}`);
}
