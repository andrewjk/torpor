import type SourceSpan from "../../types/SourceSpan";
import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import isSpecialNode from "../../utils/isSpecialNode";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import addMappedTextWithOffsets from "./addMappedTextWithOffsets";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";
import getAttributeOffsets from "./getAttributeOffsets";
import replaceForVarNames from "./replaceForVarNames";

export default function buildComponentNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	root = false,
): void {
	b.append("");
	b.append("/* @component */");

	// TODO: map params to props

	// Props
	const componentHasProps = node.attributes.length || root;
	const propsName = componentHasProps ? nextVarName("props", status) : "undefined";
	if (componentHasProps) {
		// NOTE: The $props object is wrapped in a proxy so that components can
		// be updated if they refer to a $props.property in e.g. an element's
		// attribute
		// TODO: default props etc
		status.imports.add("$watch");

		// Gather props, runs and binding runs, and set them all at once
		let props: {
			name: string;
			// Text to be ignored in the mapping e.g. `t_class(`
			preText: string;
			value: string;
			// Text to be ignored in the mapping e.g. `)`
			postText: string;
			spans: SourceSpan[];
			offsets: number[];
			lengths: number[];
		}[] = [];
		let runs: string[] = [];
		let bindingRuns: string[] = [];

		for (let { name, value, reactive, fullyReactive, span } of node.attributes) {
			if (name === "self" && node.tagName === "@component") {
				// Ignore this special attribute
			} else if (value != null && fullyReactive) {
				if (name.startsWith("&")) {
					// It's a bound property
					// Add two $runs -- one to update the props, and one to update the value
					// The component author will need to make sure $props.x is updated
					// TODO: Maybe allow adding a Bindable<T> type to the $props interface??
					// e.g. Component($props: { text: Bindable<string> })
					name = name.substring(1);
					props.push({
						name,
						preText: "",
						value,
						postText: "",
						spans: [span],
						offsets: [],
						lengths: [],
					});
					runs.push(`${propsName}["${name}"] = ${value};`);
					bindingRuns.push(`${value} = ${propsName}["${name}"];`);
				} else if (name === "class") {
					status.imports.add("t_class");
					const params = [value];
					if (node.scopeStyles) {
						params.push(`"torp-${status.styleHash}"`);
					}
					value = params.join(", ");
					props.push({
						name,
						preText: "t_class(",
						value,
						postText: ")",
						spans: [span],
						offsets: [],
						lengths: [],
					});
					runs.push(`${propsName}["${name}"] = t_class(${value});`);
				} else if (name === "style") {
					status.imports.add("t_style");
					props.push({
						name,
						preText: "t_style(",
						value,
						postText: ")",
						spans: [span],
						offsets: [],
						lengths: [],
					});
					runs.push(`${propsName}["${name}"] = t_style(${value});`);
				} else {
					props.push({
						name,
						preText: "",
						value,
						postText: "",
						spans: [span],
						offsets: [],
						lengths: [],
					});
					runs.push(`${propsName}["${name}"] = ${value};`);
				}
			} else if (value != null && reactive) {
				const { newValue, spans, offsets, lengths } = getAttributeOffsets(value, span);
				value = newValue;
				if (name === "class") {
					status.imports.add("t_class");
					const params = [value];
					if (node.scopeStyles) {
						params.push(`"torp-${status.styleHash}"`);
					}
					value = params.join(", ");
					props.push({ name, preText: "t_class(", value, postText: ")", spans, offsets, lengths });
					runs.push(`${propsName}["${name}"] = t_class(${value});`);
				} else if (name === "style") {
					status.imports.add("t_style");
					props.push({ name, preText: "t_style(", value, postText: ")", spans, offsets, lengths });
					runs.push(`${propsName}["${name}"] = t_style(${value});`);
				} else {
					props.push({ name, preText: "", value, postText: "", spans, offsets, lengths });
					runs.push(`${propsName}["${name}"] = ${value};`);
				}
			} else if (value != null) {
				props.push({
					name,
					preText: "",
					value,
					postText: "",
					spans: [span],
					offsets: [],
					lengths: [],
				});
			} else {
				props.push({
					name,
					preText: "",
					value: "true",
					postText: "",
					spans: [span],
					offsets: [],
					lengths: [],
				});
			}
		}

		// Set the props, runs and binding runs that we gathered
		b.append(`const ${propsName} = $watch({`);
		for (let p of props) {
			let value = replaceForVarNames(p.value, status);
			if (p.spans.length === 1) {
				addMappedText(`${p.name}: ` + p.preText, value, p.postText + ",", p.spans[0], status, b);
			} else {
				addMappedTextWithOffsets(
					`${p.name}: ` + p.preText,
					value,
					p.postText + ",",
					p.spans,
					p.offsets,
					p.lengths,
					status,
					b,
				);
			}
		}
		b.append("});");
		// TODO: Map these things:
		if (runs.length) {
			buildRun("setProps", replaceForVarNames(runs.join("\n"), status), status, b);
		}
		if (bindingRuns.length) {
			buildRun("setBindings", replaceForVarNames(bindingRuns.join("\n"), status), status, b);
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
			if (isSpecialNode(slot) && slot.tagName === "fill") {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";
				const slotParams = [
					"$sparent: ParentNode",
					"$sanchor: Node | null",
					slot.hasSlotProps
						? "$sprops: Record<PropertyKey, any>"
						: "// @ts-ignore\n$sprops?: Record<PropertyKey, any>",
					"// @ts-ignore\n$context?: Record<PropertyKey, any>",
				];
				b.append(
					`${slot.hasSlotProps ? "// @ts-ignore\n" : ""}${slotsName}["${slotName}"] = (\n${slotParams.join(",\n")}\n) => {`,
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

	let componentName = node.tagName;
	if (componentName === "@component") {
		let selfAttribute = node.attributes.find((a) => a.name === "self");
		if (selfAttribute && selfAttribute.value && selfAttribute.fullyReactive) {
			componentName = selfAttribute.value;
		}
	}

	// TODO: Map the params properly, either by checking for things ourselves,
	// or better checking for $props being undefined in components
	//addMappedText("", componentName, `(${renderParams});`, node.span, status, b);
	addMappedText("", `${componentName}(${renderParams})`, ";", node.span, status, b);

	b.append("");
}
