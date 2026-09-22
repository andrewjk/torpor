import type SourceSpan from "../../types/SourceSpan";
import type ElementNode from "../../types/nodes/ElementNode";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../../utils/Builder";
import trimEnd from "../../utils/trimEnd";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import buildMount from "./buildMount";
import buildNode from "./buildNode";
import buildRun from "./buildRun";
import getAttributeOffsets from "./getAttributeOffsets";
import replaceForVarNames from "./replaceForVarNames";
import stashRun from "./stashRun";
import stashRunWithOffsets from "./stashRunWithOffsets";

export default function buildElementNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
): void {
	if (status.inHead) {
		if (node.tagName === "title") {
			buildTitleNode(node, status, b);
		} else {
			buildHeadNode(node, status, b);
		}
		return;
	}

	const svgElement = node.tagName === "svg";
	const oldns = status.ns;
	if (svgElement) {
		status.ns = true;
	}

	const varName = node.varName;
	if (varName) {
		if (node.tagName === "@element") {
			buildDynamicElementNode(node, status, b);
			return;
		}

		buildElementAttributes(node, varName, status, b);
	}

	const oldPreserveWhitespace = status.preserveWhitespace;
	status.preserveWhitespace = node.tagName === "code" || node.tagName === "pre";
	for (let child of node.children) {
		buildNode(child, status, b, parentName, "null");
	}
	status.preserveWhitespace = oldPreserveWhitespace;

	if (svgElement) {
		status.ns = oldns;
	}
}

function buildDynamicElementNode(node: ElementNode, status: BuildStatus, b: Builder) {
	let selfAttribute = node.attributes.find((a) => a.name === "self");

	if (selfAttribute && selfAttribute.value) {
		status.imports.add("t_dynamic");
		let selfValue = selfAttribute.value;

		if (selfAttribute.fullyReactive) {
			// Swap the tag whenever the expression changes. Emitted BEFORE
			// the attributes below, so the events it stashes (and the
			// reactive attribute runs) apply to the swapped element;
			// t_dynamic copies the current attribute values and event
			// listeners onto the new tag
			status.imports.add("$run");
			b.append("$run(() => {");
			b.append(`${node.varName} = t_dynamic(${node.varName}, ${selfValue});`);
			b.append(`}${status.options.dev === true ? `, "setDynamic"` : ""});`);
		} else {
			// A static (or interpolated, non-reactive) tag: swap once
			b.append(`${node.varName} = t_dynamic(${node.varName}, ${selfValue});`);
		}
	}

	// Apply the element's reactive attributes and events —
	// buildElementAttributes skips `self` (and &ref) itself. Static
	// attributes are already in the fragment's template HTML and are
	// carried across tag swaps by t_dynamic's attribute copy
	buildElementAttributes(node, node.varName!, status, b);

	// Process children with the existing fragment stack (parent's fragment),
	// so text content effects are properly stashed and emitted by the parent
	for (let child of node.children) {
		buildNode(child, status, b, node.varName!, "null");
	}
}

function buildTitleNode(node: ElementNode, status: BuildStatus, b: Builder) {
	let content = (node.children[0] as TextNode).content || "";

	// Replace all spaces with a single space, both to save space and to remove
	// newlines from generated JS strings
	content = content.replace(/\s+/g, " ");

	// TODO: Should be fancier about this in parse -- e.g. ignore braces in
	// quotes, unclosed, etc
	let reactiveStarted = false;
	let reactiveCount = 0;
	for (let i = 0; i < content.length; i++) {
		if (content[i] === "{") {
			reactiveStarted = true;
		} else if (content[i] === "}") {
			if (reactiveStarted) {
				reactiveCount += 1;
				reactiveStarted = false;
			}
		}
	}

	if (reactiveCount) {
		status.imports.add("t_fmt");
		if (reactiveCount === 1 && content.startsWith("{") && content.endsWith("}")) {
			content = `t_fmt(${content.substring(1, content.length - 1)})`;
		} else {
			content = `\`${content.replaceAll("{", "${t_fmt(").replaceAll("}", ")}")}\``;
		}
	} else {
		content = `"${content}"`;
	}

	status.imports.add("$run");
	b.append("$run(() => {");
	b.append(`
			const t_old_title = document.title;
			document.title = ${content};
			return () => document.title = t_old_title;
		}${status.options.dev === true ? `, "runTitle"` : ""});`);
}

function buildHeadNode(node: ElementNode, status: BuildStatus, b: Builder) {
	status.imports.add("$run");
	status.imports.add("t_head_element");
	// Look for an existing element to reuse, so that hydrating server rendered
	// tags (or revisiting a page with the same tags) doesn't add duplicates
	// to the head. The title is handled separately, in buildTitleNode
	const selector = headElementSelector(node);
	b.append("$run(() => {");
	b.append(`
			const t_head_el = t_head_element("${node.tagName}", ${JSON.stringify(selector)});`);
	for (let { name, value, span } of node.attributes) {
		if (value != null) {
			status.imports.add("t_attribute");
			value = replaceForVarNames(value, status);
			addMappedText(`t_attribute(t_head_el, "${name}", `, value, ");", span, status, b);
		}
	}
	b.append(`}${status.options.dev === true ? `, "runHead"` : ""});`);
}

/**
 * Builds a selector that finds an equivalent element in the head, from the
 * attributes that identify it (e.g. `meta[name="description"]`). Returns an
 * empty string when the element has no identifying attributes, in which case
 * a new element is always created.
 */
function headElementSelector(node: ElementNode): string {
	const identityAttributes = ["name", "property", "rel", "charset", "http-equiv", "itemprop"];
	const parts: string[] = [];
	for (let { name, value, reactive } of node.attributes) {
		if (!identityAttributes.includes(name) || value == null || reactive) continue;
		const attributeValue = trimQuotes(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
		parts.push(`[${name}="${attributeValue}"]`);
	}
	return parts.length ? node.tagName + parts.join("") : "";
}

function buildElementAttributes(
	node: ElementNode,
	varName: string,
	status: BuildStatus,
	b: Builder,
) {
	let fragment = status.fragmentStack.at(-1)?.fragment;
	if (!fragment) throw new Error("No fragment on stack");

	// TODO: Add an error if any reactive attributes are used non-reactively

	// Pair up &-bindings with user event handlers for the same event, so a
	// single t_event can be emitted for both -- delegated event handlers are
	// last-write-wins per element and type, so a second t_event would clobber
	// the binding's state write
	const combinedHandlers = combinedEventHandlers(node, status);
	const consumedHandlers = new Set(Array.from(combinedHandlers.values(), (c) => c.index));

	for (let [index, { name, value, reactive, fullyReactive, span }] of node.attributes.entries()) {
		if (name === "self" && node.tagName === "@element") {
			// Ignore this special attribute
		} else if (name === "&ref") {
			// Ignore this one, it should have been done already, above
		} else if (value != null && fullyReactive) {
			if (name === "&group") {
				buildBindGroupAttribute(node, varName, value, status, b, combinedHandlers.get(index));
			} else if (name === "&value" || name === "&checked") {
				buildBindAttribute(node, varName, name, value, status, b, combinedHandlers.get(index));
			} else if (name === "onmount") {
				// The onmount event is faked by us by creating an $onmount. This
				// also means that you can have unmount functionality by
				// returning a cleanup function
				buildMount("elMount", `return (${trimEnd(value.trim(), ";")})(${varName});`, status, b);
			} else if (name.startsWith("on")) {
				// Skip handlers that were combined with a &-binding above
				if (!consumedHandlers.has(index)) {
					buildEventAttribute(varName, name, value, span, status, b);
				}
			} else if (name.startsWith("transition")) {
				buildTransitionAttribute(node, varName, name, value, status, b);
			} else if (name === "class") {
				status.imports.add("t_class");
				const params = [value];
				if (node.scopeStyles) {
					params.push(`"torp-${status.styleHash}"`);
				}
				// SVGs have a different className
				const propName = status.ns ? "className.baseVal" : "className";
				stashRun(
					fragment,
					`${status.ns ? "// @ts-ignore\n" : ""}${varName}.${propName} = t_class(`,
					params.join(", "),
					");",
					span,
					status,
				);
			} else if (name === "style") {
				status.imports.add("t_style");
				stashRun(fragment, `${varName}.style.cssText += t_style(`, value, ");", span, status);
			} else if (name.includes("-")) {
				// Handle data-, aria- etc
				status.imports.add("t_attribute");
				stashRun(fragment, `t_attribute(${varName}, "${name}", `, value, ");", span, status);
				// NOTE: dataset seems to be a tiny bit slower?
				//const propName = name.substring(name.indexOf("-"));
				//buildRun("setDataAttribute", `${varName}.dataset.${propName} = ${value};`, status, b);
			} else {
				status.imports.add("t_attribute");
				stashRun(fragment, `t_attribute(${varName}, "${name}", `, value, ");", span, status);
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
				// SVGs have a different className
				const propName = status.ns ? "className.baseVal" : "className";
				stashRunWithOffsets(
					fragment,
					`${status.ns ? "// @ts-ignore\n" : ""}${varName}.${propName} = t_class(`,
					params.join(", "),
					");",
					spans,
					offsets,
					lengths,
					status,
				);
			} else if (name === "style") {
				status.imports.add("t_style");
				stashRunWithOffsets(
					fragment,
					`${varName}.style.cssText += t_style(`,
					value,
					");",
					spans,
					offsets,
					lengths,
					status,
				);
			} else if (name.includes("-")) {
				// Handle data-, aria- etc
				status.imports.add("t_attribute");
				stashRunWithOffsets(
					fragment,
					`t_attribute(${varName}, "${name}", `,
					value,
					");",
					spans,
					offsets,
					lengths,
					status,
				);
				// NOTE: dataset seems to be a tiny bit slower?
				//const propName = name.substring(name.indexOf("-"));
				//buildRun("setDataAttribute", `${varName}.dataset.${propName} = ${value};`, status, b);
			} else {
				status.imports.add("t_attribute");
				stashRunWithOffsets(
					fragment,
					`t_attribute(${varName}, "${name}", `,
					value,
					");",
					spans,
					offsets,
					lengths,
					status,
				);
			}
		}
	}
}

function buildBindGroupAttribute(
	node: ElementNode,
	varName: string,
	value: string,
	status: BuildStatus,
	b: Builder,
	combined?: CombinedHandler,
) {
	value = replaceForVarNames(value, status);

	// Automatically add an event to bind the value
	// TODO: Only tested this with radio buttons
	let eventName = "change";
	let inputValue = node.attributes.find((a) => a.name === "value")?.value;
	let set = `${value} == ${inputValue}`;
	let propName = "checked";
	const setAttribute = `${varName}.${propName} = ${set}`;
	buildRun("setBinding", `${setAttribute};`, status, b);
	// TODO: Add a parseInput method that handles NaN etc
	emitBindEvent(
		varName,
		eventName,
		`(e) => {
				if (e.target.${propName}) ${value} = ${inputValue};
			}`,
		`if (e.target.${propName}) ${value} = ${inputValue};`,
		combined,
		status,
		b,
	);
}

function buildBindAttribute(
	node: ElementNode,
	varName: string,
	name: string,
	value: string,
	status: BuildStatus,
	b: Builder,
	combined?: CombinedHandler,
) {
	value = replaceForVarNames(value, status);

	// Automatically add an event to bind the value
	let eventName = bindEventName(node, name);
	let defaultValue = '""';
	let inputValue = "e.target.value";
	if (node.tagName === "input") {
		let typeAttribute = node.attributes.find((a) => a.name === "type");
		if (typeAttribute && typeAttribute.value) {
			switch (trimQuotes(typeAttribute.value)) {
				case "number": {
					defaultValue = "0";
					inputValue = "Number(e.target.value)";
					break;
				}
				case "checkbox": {
					defaultValue = "false";
					inputValue = "e.target.checked";
					break;
				}
			}
		}
	} else if (node.tagName === "select") {
		// <select multiple> binds an array of selected option values
		let multipleAttribute = node.attributes.find((a) => a.name === "multiple");
		if (multipleAttribute) {
			buildRun(
				"setBinding",
				`Array.from(${varName}.options).forEach((opt) => opt.selected = Array.isArray(${value}) && ${value}.includes(opt.value));`,
				status,
				b,
			);
			emitBindEvent(
				varName,
				eventName,
				`(e) => ${value} = Array.from(e.target.selectedOptions).map((opt) => opt.value)`,
				`${value} = Array.from(e.target.selectedOptions).map((opt) => opt.value);`,
				combined,
				status,
				b,
			);
			return;
		}
	}
	let set = `${value} || ${defaultValue}`;
	const propName = name.substring(1);
	// NOTE: The DOM value property is always a string, while the bound state
	// may be a number (e.g. with `<input type="number">`), so convert
	const setAttribute =
		propName === "value"
			? `${varName}.${propName} = String(${set})`
			: `${varName}.${propName} = ${set}`;
	buildRun("setBinding", `${setAttribute};`, status, b);
	// TODO: Add a parseInput method that handles NaN etc
	emitBindEvent(
		varName,
		eventName,
		`(e) => ${value} = ${inputValue}`,
		`${value} = ${inputValue};`,
		combined,
		status,
		b,
	);
}

/**
 * Gets the name of the event that a &-binding attribute uses to write the
 * element's state back to the bound value
 */
function bindEventName(node: ElementNode, name: string): string {
	if (name === "&group") return "change";
	if (node.tagName === "select") return "change";
	if (node.tagName === "input") {
		let typeAttribute = node.attributes.find((a) => a.name === "type");
		if (typeAttribute?.value && trimQuotes(typeAttribute.value) === "radio") {
			return "change";
		}
	}
	return "input";
}

/**
 * A user `on<event>` handler that competes with a &-binding for the same
 * event type on an element. Both must share a single t_event call, because
 * delegated event handlers are last-write-wins per element and type.
 */
interface CombinedHandler {
	/** Attribute index of the user handler */
	index: number;
	/** The handler expression, with loop vars replaced */
	value: string;
	/** Source span of the handler expression, for source maps */
	span: SourceSpan;
	/** Whether the handler is called before the binding write (source order) */
	first: boolean;
}

/**
 * Pairs &-binding attributes (&value, &checked, &group) with user `on<event>`
 * handler attributes listening to the same event. Both would emit their own
 * t_event call for the element, but the second registration would clobber
 * the first -- typically the binding's state write -- so the pair is emitted
 * as one t_event that calls the binding write and the user handler in source
 * order. Returns a map from binding attribute index to the combined handler.
 */
function combinedEventHandlers(
	node: ElementNode,
	status: BuildStatus,
): Map<number, CombinedHandler> {
	const bindings = new Map<string, number>();
	const handlers = new Map<string, number>();
	for (let [index, { name, value, fullyReactive }] of node.attributes.entries()) {
		if (value == null || !fullyReactive) continue;
		if (name === "&value" || name === "&checked" || name === "&group") {
			bindings.set(bindEventName(node, name), index);
		} else if (name.startsWith("on")) {
			handlers.set(name.substring(2), index);
		}
	}
	const combined = new Map<number, CombinedHandler>();
	for (let [eventName, bindingIndex] of bindings) {
		const handlerIndex = handlers.get(eventName);
		if (handlerIndex === undefined) continue;
		const handler = node.attributes[handlerIndex];
		combined.set(bindingIndex, {
			index: handlerIndex,
			value: replaceForVarNames(handler.value!, status),
			span: handler.span,
			first: handlerIndex < bindingIndex,
		});
	}
	return combined;
}

/**
 * Emits the t_event call for a &-binding, optionally combined with a user
 * `on<event>` handler for the same event (which is called after -- or, when
 * it appeared first in source, before -- the binding write)
 */
function emitBindEvent(
	varName: string,
	eventName: string,
	listener: string,
	body: string,
	combined: CombinedHandler | undefined,
	status: BuildStatus,
	b: Builder,
): void {
	status.imports.add("t_event");
	if (!combined) {
		b.append(`t_event(${varName}, "${eventName}", ${listener});`);
		return;
	}
	b.append(`t_event(${varName}, "${eventName}", (e) => {`);
	// NOTE: The cast is needed because the handler may not take an event
	// parameter, and an optional call would otherwise not typecheck
	const handlerCall = `((${combined.value}) as ((e: any) => any) | undefined)?.(e);`;
	if (combined.first) {
		addMappedText("", handlerCall, "", combined.span, status, b);
		b.append(body);
	} else {
		b.append(body);
		addMappedText("", handlerCall, "", combined.span, status, b);
	}
	b.append("});");
}

function buildEventAttribute(
	varName: string,
	name: string,
	value: string,
	span: SourceSpan,
	status: BuildStatus,
	b: Builder,
) {
	value = replaceForVarNames(value, status);

	// Add an event listener, after the fragment has been added
	const eventName = name.substring(2);
	status.imports.add("t_event");
	addMappedText(`t_event(${varName}, "${eventName}", `, value, `);`, span, status, b);
}

function buildTransitionAttribute(
	node: ElementNode,
	varName: string,
	name: string,
	value: string,
	status: BuildStatus,
	b: Builder,
) {
	value = replaceForVarNames(value, status);

	status.imports.add("t_animate");

	// Add an in and out transition, after the fragment has been added
	// TODO: Separate these -- you should be able to have multiple,
	// unrelated entry and exit transitions?
	let entryVarName = nextVarName("trans_in", status);
	let exitVarName = nextVarName("trans_out", status);

	if (name === "transition") {
		b.append(`const ${entryVarName} = (${value})(${varName});`);
		b.append(`const ${exitVarName} = ${entryVarName};`);
		b.append(`t_animate(${varName}, ${entryVarName}, ${exitVarName});`);
	} else if (name === "transition-in") {
		let outAttribute = node.attributes.find((a) => a.name === "transition-out");
		if (outAttribute && outAttribute.value && outAttribute.fullyReactive) {
			let outValue = outAttribute.value;
			b.append(`const ${entryVarName} = (${value})(${varName});`);
			b.append(`const ${exitVarName} = (${outValue})(${varName});`);
			b.append(`t_animate(${varName}, ${entryVarName}, ${exitVarName});`);
		} else {
			b.append(`const ${entryVarName} = (${value})(${varName});`);
			b.append(`t_animate(${varName}, ${entryVarName});`);
		}
	} else if (name === "transition-out") {
		let inAttribute = node.attributes.find((a) => a.name === "transition-in");
		if (inAttribute) {
			// This has already been handled with transition-in, above
			return;
		} else {
			b.append(`const ${exitVarName} = (${value})(${varName});`);
			b.append(`t_animate(${varName}, null, ${entryVarName});`);
		}
	} else {
		// TODO: Add an error
	}
}
