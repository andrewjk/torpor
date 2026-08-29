import type SourceSpan from "../../types/SourceSpan";
import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import bindingTarget from "../../utils/bindingTarget";
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
			preText?: string;
			value: string;
			// Text to be ignored in the mapping e.g. `)`
			postText?: string;
			spans: SourceSpan[];
			offsets?: number[];
			lengths?: number[];
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
						value,
						spans: [span],
					});
					runs.push(`${propsName}["${name}"] = ${value};`);
					bindingRuns.push(bindingTarget(value, `${propsName}["${name}"]`, name, status.imports));
				} else if (name === "class") {
					if (node.scopeStyles) {
						value = `[${value}, "torp-${status.styleHash}"]`;
					}
					props.push({
						name,
						value,
						spans: [span],
					});
					runs.push(`${propsName}["${name}"] = ${value};`);
				} else if (name === "style") {
					props.push({
						name,
						value,
						spans: [span],
					});
					runs.push(`${propsName}["${name}"] = ${value};`);
				} else {
					props.push({
						name,
						value,
						spans: [span],
					});
					runs.push(`${propsName}["${name}"] = ${value};`);
				}
			} else if (value != null && reactive) {
				const { newValue, spans, offsets, lengths } = getAttributeOffsets(value, span);
				value = newValue;
				if (name === "class") {
					if (node.scopeStyles) {
						value = `[${value}, "torp-${status.styleHash}"]`;
					}
					props.push({ name, value, spans, offsets, lengths });
					runs.push(`${propsName}["${name}"] = ${value};`);
				} else if (name === "style") {
					props.push({ name, value, spans, offsets, lengths });
					runs.push(`${propsName}["${name}"] = ${value};`);
				} else {
					props.push({ name, value, spans, offsets, lengths });
					runs.push(`${propsName}["${name}"] = ${value};`);
				}
			} else if (value != null) {
				if (name === "class" && node.scopeStyles) {
					value = `"${trimQuotes(value)} torp-${status.styleHash}"`;
				}
				props.push({
					name,
					value,
					// Set non-reactive props with `as const` so that typescript
					// won't complain when passing e.g. strings to string unions
					postText: " as const",
					spans: [span],
				});
			} else {
				props.push({
					name,
					value: "true",
					spans: [span],
				});
			}
		}

		// Set the props, runs and binding runs that we gathered
		b.append(`let ${propsName} = $watch({`);
		for (let p of props) {
			let value = replaceForVarNames(p.value, status);
			p.preText ??= "";
			p.postText ??= "";
			if (p.spans.length === 1) {
				addMappedText(
					p.name ? `${p.name}: ` + p.preText : p.preText,
					value,
					p.postText + ",",
					p.spans[0],
					status,
					b,
				);
			} else {
				addMappedTextWithOffsets(
					p.name ? `${p.name}: ` + p.preText : p.preText,
					value,
					p.postText + ",",
					p.spans,
					p.offsets!,
					p.lengths!,
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
			if (isSpecialNode(slot) && (slot.tagName === "fill" || slot.tagName === "filldef")) {
				const nameAttribute = slot.attributes.find((a) => a.name === "name");
				const slotName = nameAttribute?.value ? trimQuotes(nameAttribute.value) : "_";
				const slotParams = [
					"$sparent: ParentNode",
					"$sanchor: Node | null",
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
				// optional $slot param of the SlotRender type
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
