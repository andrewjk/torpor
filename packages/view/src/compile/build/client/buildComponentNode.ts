import { type ElementNode } from "../../types/nodes/ElementNode";
import isSpecialNode from "../../types/nodes/isSpecialNode";
import Builder from "../../utils/Builder";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import { type BuildStatus } from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";

export default function buildComponentNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	root = false,
): void {
	b.append("");
	b.append("/* @component */");

	// Props
	const componentHasProps = node.attributes.length || root;
	const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
	if (componentHasProps) {
		// NOTE: The $props object is wrapped in a proxy so that components can
		// be updated if they refer to a $props.property in e.g. an element's
		// attribute
		// TODO: default props etc
		status.imports.add("$watch");
		b.append(`const ${propsName}: any = $watch({});`);

		for (let { name, value, reactive, fullyReactive } of node.attributes) {
			if (name === "self" && node.tagName === ":component") {
				// Ignore this special attribute
			} else if (name.startsWith("&") && value != null && fullyReactive) {
				// It's a bound property
				// Add two $runs -- one to update the props, and one to update the value
				// The component author will need to make sure $props.x is updated
				// TODO: Maybe allow adding a Bindable<T> type to the $props interface??
				// e.g. Component($props: { text: Bindable<string> })
				name = name.substring(1);
				buildRun("setProp", `${propsName}["${name}"] = ${value};`, status, b);
				buildRun("setBinding", `${value} = ${propsName}["${name}"];`, status, b);
			} else if ((name === "class" || name === ":class") && value != null) {
				// NOTE: :class is obsolete, but let's keep it for a version or two
				status.imports.add("t_class");
				const params = [value];
				if (node.scopeStyles) {
					params.push(`"torp-${status.styleHash}"`);
				}
				buildRun("setClasses", `${propsName}["class"] = t_class(${params.join(", ")});`, status, b);
			} else if ((name === "style" || name === ":style") && value != null) {
				// NOTE: :style is obsolete, but let's keep it for a version or two
				status.imports.add("t_style");
				buildRun("setStyles", `${propsName}["style"] = t_style(${value});`, status, b);
			} else if (value != null) {
				const setProp = `${propsName}["${name}"] = ${value};`;
				if (reactive) {
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
		b.append(`const ${slotsName}: Record<string, SlotRender> = {};`);
		for (let slot of node.children) {
			if (isSpecialNode(slot)) {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";
				const slotParams = [
					"$sparent: ParentNode",
					"$sanchor: Node | null",
					"//@ts-ignore\n$sprops?: Record<PropertyKey, any>",
					"//@ts-ignore\n$context?: Record<PropertyKey, any>",
				];
				b.append(`${slotsName}["${slotName}"] = (\n${slotParams.join(",\n")}\n) => {`);

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

	let componentName = node.tagName;
	if (componentName === ":component") {
		let selfAttribute = node.attributes.find((a) => a.name === "self");
		if (selfAttribute && selfAttribute.value && selfAttribute.fullyReactive) {
			componentName = selfAttribute.value;
		}
	}

	b.append(`${componentName}(${renderParams});`);
	b.append("");
}
