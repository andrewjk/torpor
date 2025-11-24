import type SourceSpan from "../../types/SourceSpan";
import type ElementNode from "../../types/nodes/ElementNode";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../../utils/Builder";
import trimEnd from "../../utils/trimEnd";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
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
	root = false,
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
		}

		// PERF: Does this have much of an impact??
		if (root) {
			//status.imports.add("t_apply_props");
			//// TODO: I think we know what the props are at this stage, so we could be more direct?
			//b.append("");
			//b.append(
			//	`t_apply_props(${varName}, $props, [${status.props.map((p) => `'${p}'`).join(", ")}]);`,
			//);
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
	if (selfAttribute && selfAttribute.value && selfAttribute.fullyReactive) {
		status.imports.add("$run");
		status.imports.add("t_dynamic");
		let selfValue = selfAttribute.value;

		b.append("$run(() => {");
		b.append(`${node.varName} = t_dynamic(${node.varName}, ${selfValue});`);

		let parentName = node.varName;

		buildFragment(node, status, b, parentName!, "null");

		status.fragmentStack.push({
			fragment: node.fragment,
			path: "",
		});
		for (let child of node.children) {
			buildNode(child, status, b, parentName!, "null");
		}
		status.fragmentStack.pop();

		buildAddFragment(node, status, b, parentName!, "null");

		b.append(`}${status.options.dev === true ? `, "setDynamic"` : ""});`);
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
	// TODO: dedupe e.g. <meta name="x"> or on special key
	b.append("$run(() => {");
	b.append(`
			const t_head_el = document.createElement("${node.tagName}");
			document.getElementsByTagName("head")[0].appendChild(t_head_el);`);
	for (let { name, value, span } of node.attributes) {
		if (value != null) {
			status.imports.add("t_attribute");
			value = replaceForVarNames(value, status);
			addMappedText(`t_attribute(t_head_el, "${name}", `, value, ");", span, status, b);
		}
	}
	b.append(`}${status.options.dev === true ? `, "runHead"` : ""});`);
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

	// Do &ref first, just in case any other attributes depend on it being set
	// e.g. if you have a `style` attribute that depends on the element's size
	const refAttribute = node.attributes.find((a) => a.name === "&ref");
	if (refAttribute) {
		let { value, fullyReactive } = refAttribute;
		if (value != null && fullyReactive) {
			// Bind the DOM element to a user-defined variable
			b.append(`${value} = ${varName};`);
		}
	}

	for (let { name, value, reactive, fullyReactive, span } of node.attributes) {
		if (name === "self" && node.tagName === "@element") {
			// Ignore this special attribute
		} else if (name === "&ref") {
			// Ignore this one, it should have been done already, above
		} else if (value != null && fullyReactive) {
			if (name === "&group") {
				buildBindGroupAttribute(node, varName, value, status, b);
			} else if (name === "&value" || name === "&checked") {
				buildBindAttribute(node, varName, name, value, status, b);
			} else if (name === "onmount") {
				// The onmount event is faked by us by creating a $mount. This
				// also means that you can have unmount functionality by
				// returning a cleanup function
				buildMount("elMount", `return (${trimEnd(value.trim(), ";")})(${varName});`, status, b);
			} else if (name.startsWith("on")) {
				buildEventAttribute(varName, name, value, span, status, b);
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
				status.imports.add("t_attribute");
				status.imports.add("t_style");
				stashRun(
					fragment,
					`t_attribute(${varName}, "style", t_style(`,
					value,
					") || null);",
					span,
					status,
				);
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
					`${varName}.setAttribute("style", t_style(`,
					value,
					"));",
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
	status.imports.add("t_event");
	b.append(`t_event(${varName}, "${eventName}", (e) => {
			if (e.target.${propName}) ${value} = ${inputValue};
		});`);
}

function buildBindAttribute(
	node: ElementNode,
	varName: string,
	name: string,
	value: string,
	status: BuildStatus,
	b: Builder,
) {
	value = replaceForVarNames(value, status);

	// Automatically add an event to bind the value
	// TODO: Need to check the element to find out what type of event to add
	let eventName = "input";
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
				case "radio": {
					eventName = "change";
					inputValue = "e.target.value";
					break;
				}
			}
		}
	} else if (node.tagName === "select") {
		eventName = "change";
	}
	let set = `${value} || ${defaultValue}`;
	const propName = name.substring(1);
	const setAttribute = `${varName}.${propName} = ${set}`;
	buildRun("setBinding", `${setAttribute};`, status, b);
	// TODO: Add a parseInput method that handles NaN etc
	status.imports.add("t_event");
	b.append(`t_event(${varName}, "${eventName}", (e) => ${value} = ${inputValue});`);
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
