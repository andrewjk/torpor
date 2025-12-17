import type SourceSpan from "../../types/SourceSpan";
import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import isSpecialNode from "../../utils/isSpecialNode";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";
import replaceForVarNames from "./replaceForVarNames";

export default function buildSlotNode(node: ElementNode, status: BuildStatus, b: Builder): void {
	// If there's a slot, build that, otherwise build the default nodes
	let slotName = node.attributes.find((a) => a.name === "name")?.value;
	slotName = slotName ? trimQuotes(slotName) : "_";

	// Slot props
	const propsName = nextVarName("slot_props", status);
	const slotAttributes = node.attributes.filter((a) => a.name !== "name");
	const slotHasProps = slotAttributes.length;
	if (slotHasProps) {
		// TODO: defaults etc props
		status.imports.add("$watch");

		// Gather props, runs and binding runs, and set them all at once
		let props: { name: string; value: string; span: SourceSpan }[] = [];
		let runs: string[] = [];

		for (let { name, value, reactive, span } of slotAttributes) {
			if (value != null) {
				props.push({ name, value, span });
				if (reactive) {
					runs.push(`${propsName}["${name}"] = ${value};`);
				}
			} else {
				props.push({ name, value: "true", span });
			}
		}

		// Set the props, runs and binding runs that we gathered
		b.append(`const ${propsName} = $watch({`);
		for (let p of props) {
			let value = replaceForVarNames(p.value, status);
			addMappedText(`${p.name}: `, value, ",", p.span, status, b);
		}
		b.append("});");
		// TODO: Map these things:
		if (runs.length) {
			buildRun("setProps", replaceForVarNames(runs.join("\n"), status), status, b);
		}
	}

	const slotParentName = node.parentName!;
	const slotAnchorName = node.varName!;

	b.append(`if ($slots && $slots["${slotName}"]) {`);
	let params = [slotParentName, slotAnchorName, slotHasProps ? propsName : "undefined", "$context"];
	b.append(`$slots["${slotName}"](${params.join(", ")})`);

	// TODO: Maybe not if there's only a single space node?
	const fill = node.children.find((c) => isSpecialNode(c) && c.tagName === "fill");
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
