import type ElementNode from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../../utils/Builder";
import trimMatched from "../../utils/trimMatched";
import trimQuotes from "../../utils/trimQuotes";
import isFullyReactive from "../utils/isFullyReactive";
import isReactive from "../utils/isReactive";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";

export default function buildComponentNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	root = false,
) {
	b.append("");
	b.append("/* @component */");

	// Props
	const componentHasProps = node.attributes.length || root;
	const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
	if (componentHasProps) {
		// TODO: defaults etc props
		//status.imports.add("$watch");
		//b.append(`const ${propsName} = $watch({});`);
		b.append(`const ${propsName} = {};`);
		for (let { name, value } of node.attributes) {
			if (name === "self" && node.tagName === ":component") {
				// Ignore this special attribute
			} else if (name.startsWith("{") && name.endsWith("}")) {
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
				if (name === "class") {
					// TODO: How to handle dynamic classes etc
					// Probably just compile down to a string?
					value = `"${trimQuotes(value)} tera-${status.styleHash}"`;
				}
				const setProp = `${propsName}["${name}"] = ${value};`;
				if (fullyReactive || partlyReactive) {
					buildRun("setProp", setProp, status, b);
				} else {
					b.append(setProp);
				}
			} else {
				b.append(`${propsName}["${name}"] = true;`);
			}
		}
		// PERF: Does this have much of an impact??
		if (root) {
			status.imports.add("$run");
			b.append(`
			if ($props) {
				const propNames = [${status.props.map((p) => `'${p}'`).join(", ")}];
				for (let name of Object.keys($props)) {
					if (!name.startsWith("$") && !propNames.includes(name)) {
						$run(() => ${propsName}[name] = $props[name]);
					}
				}
			}`);
		}
	}

	// Slots
	const componentHasSlots = node.children.length;
	const slotsName = componentHasSlots ? nextVarName("slots", status) : "undefined";
	if (componentHasSlots) {
		b.append(`const ${slotsName} = {};`);
		for (let slot of node.children) {
			if (isSpecialNode(slot)) {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";
				b.append(
					`${slotsName}["${slotName}"] = ($sparent: ParentNode, $sanchor: Node | null, $sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {`,
				);

				buildFragment(slot, status, b, "$sparent", "$sanchor");

				status.fragmentStack.push({
					fragment: slot.fragment,
					path: "",
				});
				for (let child of slot.children) {
					buildNode(child, status, b, "$sparent", "$sanchor");
				}
				status.fragmentStack.pop();

				buildAddFragment(slot, status, b, "$sparent", "$sanchor");

				b.append(`}`);
			}
		}
	}

	// Render the component
	const compParentName = node.parentName;
	const compAnchorName = node.varName;
	let renderParams = `${compParentName}, ${compAnchorName}, ${propsName}, $context`;
	if (slotsName !== "undefined") {
		renderParams += `, ${slotsName}`;
	}

	b.append("");

	let componentName = node.tagName;
	if (componentName === ":component") {
		let selfAttribute = node.attributes.find((a) => a.name === "self");
		if (selfAttribute && selfAttribute.value) {
			componentName = trimMatched(selfAttribute.value, "{", "}");
		}
	}

	b.append(`${componentName}(${renderParams});`);
}
