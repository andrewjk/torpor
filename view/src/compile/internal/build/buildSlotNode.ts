import type ElementNode from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../Builder";
import { trimQuotes } from "../utils";
import type BuildStatus from "./BuildStatus";
import addFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";
import { nextVarName } from "./buildUtils";

export default function buildSlotNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
) {
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
				name = name.substring(1, name.length - 1);
				//b.append(`$run(() => ${propsName}["${name}"] = ${name});`);
				buildRun("setProp", `${propsName}["${name}"] = ${name});`, status, b);
			} else {
				let reactive = value.startsWith("{") && value.endsWith("}");
				if (reactive) {
					value = value.substring(1, value.length - 1);
				}
				const setProp = `${propsName}["${name}"] = ${value}`;
				//b.append(reactive ? `$run(() => ${setProp});` : `${setProp};`);
				if (reactive) {
					buildRun("setProp", `${setProp};`, status, b);
				} else {
					b.append(`${setProp};`);
				}
			}
		}
	}

	const slotParentName = node.parentName!;
	const slotAnchorName = node.varName!;

	b.append(`if ($slots && $slots["${slotName}"]) {`);
	b.append(
		`$slots["${slotName}"](${slotParentName}, ${slotAnchorName}, ${slotHasProps ? propsName : "undefined"})`,
	);

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

		addFragment(fill, status, b, slotParentName, slotAnchorName);
	}

	b.append(`}`);
}
