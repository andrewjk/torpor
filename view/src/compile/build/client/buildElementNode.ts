import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import trimEnd from "../../utils/trimEnd";
import trimMatched from "../../utils/trimMatched";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import BuildStatus from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import buildRun from "./buildRun";

export default function buildElementNode(
	node: ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	root = false,
) {
	const varName = node.varName;
	if (varName) {
		if (node.tagName === ":element") {
			buildDynamicElementNode(node, status, b);
		}

		// PERF: Does this have much of an impact??
		if (root) {
			status.imports.add("t_apply_props");
			// TODO: I think we know what the props are at this stage, so we could be more direct?
			b.append("");
			b.append(
				`t_apply_props(${varName}, $props, [${status.props.map((p) => `'${p}'`).join(", ")}]);`,
			);
		}

		buildElementAttributes(node, varName, status, b);
	}

	for (let child of node.children) {
		buildNode(child, status, b, parentName, "null");
	}
}

function buildDynamicElementNode(node: ElementNode, status: BuildStatus, b: Builder) {
	let selfAttribute = node.attributes.find((a) => a.name === "self");
	if (selfAttribute) {
		status.imports.add("$run");
		status.imports.add("t_dynamic");
		let selfValue = trimMatched(selfAttribute.value, "{", "}");
		b.append(`$run(function setDynamic() {`);
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

		b.append(`});`);
	}
}

function buildElementAttributes(
	node: ElementNode,
	varName: string,
	status: BuildStatus,
	b: Builder,
) {
	// TODO: Flatten this out
	// TODO: Add an error if any reactive attributes are used non-reactively

	for (let { name, value } of node.attributes) {
		if (name === "self" && node.tagName === ":element") {
			// Ignore this special attribute
		} else if (name.startsWith("{") && name.endsWith("}")) {
			// It's a shortcut attribute
			name = name.substring(1, name.length - 1);
			buildRun("setAttribute", `${varName}.setAttribute("${name}", ${name});`, status, b);
		} else if (value.startsWith("{") && value.endsWith("}")) {
			// It's a reactive attribute
			value = value.substring(1, value.length - 1);

			if (name === "bind:self") {
				// Bind the DOM element to a user-defined variable
				b.append(`${value} = ${varName};`);
			} else if (name === "bind:group") {
				buildBindGroupAttribute(node, varName, name, value, status, b);
			} else if (name.indexOf("bind:") === 0) {
				buildBindAttribute(node, varName, name, value, status, b);
			} else if (name === "on:mount") {
				// The on:mount event is faked by us by creating a $run. This also
				// means that you can have unmount functionality by returning a
				// cleanup function
				buildRun("elMount", `return (${trimEnd(value.trim(), ";")})(${varName});`, status, b);
			} else if (name.startsWith("on")) {
				buildEventAttribute(node, varName, name, value, status, b);
			} else if (name === "transition" || name.startsWith("transition:")) {
				buildTransitionAttribute(node, varName, name, value, status, b);
			} else if (name === "class") {
				buildRun("setClassName", `${varName}.className = ${value};`, status, b);
			} else if (name.startsWith("class:")) {
				const propName = name.substring(6);
				const setAttribute = `${varName}.classList.toggle("${propName}", ${value})`;
				buildRun("setClassList", `${setAttribute};`, status, b);
			} else if (name.includes("-")) {
				// Handle data-, aria- etc
				status.imports.add("t_attribute");
				buildRun("setDataAttribute", `t_attribute(${varName}, "${name}", ${value});`, status, b);
				// NOTE: dataset seems to be a tiny bit slower?
				//const propName = name.substring(5);
				//buildRun("setDataAttribute", `${varName}.dataset.${propName} = ${value};`, status, b);
			} else {
				status.imports.add("t_attribute");
				buildRun("setAttribute", `t_attribute(${varName}, "${name}", ${value});`, status, b);
			}
		}
	}
}

function buildBindGroupAttribute(
	node: ElementNode,
	varName: string,
	name: string,
	value: string,
	status: BuildStatus,
	b: Builder,
) {
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
	// Automatically add an event to bind the value
	// TODO: Need to check the element to find out what type of event to add
	let eventName = "input";
	let defaultValue = '""';
	let inputValue = "e.target.value";
	if (node.tagName === "input") {
		let typeAttribute = node.attributes.find((a) => a.name === "type");
		if (typeAttribute) {
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
	const propName = name.substring(5);
	const setAttribute = `${varName}.${propName} = ${set}`;
	buildRun("setBinding", `${setAttribute};`, status, b);
	// TODO: Add a parseInput method that handles NaN etc
	status.imports.add("t_event");
	b.append(`t_event(${varName}, "${eventName}", (e) => ${value} = ${inputValue});`);
}

function buildEventAttribute(
	node: ElementNode,
	varName: string,
	name: string,
	value: string,
	status: BuildStatus,
	b: Builder,
) {
	// HACK: If a value from a for loop is used in the function body,
	// get it from the loop data to trigger an update when it is changed
	for (let varName of status.forVarNames) {
		value = value.replaceAll(
			new RegExp(`([\\s\\(\\[])${varName}([\\s\\.\\(\\)\\[\\];])`, "g"),
			`$1t_item.data.${varName}$2`,
		);
	}

	// Add an event listener, after the fragment has been added
	const eventName = name.substring(2);
	status.imports.add("t_event");
	b.append(`t_event(${varName}, "${eventName}", ${value});`);
}

function buildTransitionAttribute(
	node: ElementNode,
	varName: string,
	name: string,
	value: string,
	status: BuildStatus,
	b: Builder,
) {
	status.imports.add("t_animate");

	// Add an in and out transition, after the fragment has been added
	// TODO: Separate these -- you should be able to have multiple,
	// unrelated entry and exit transitions?
	let entryVarName = nextVarName("trans_in", status);
	let exitVarName = nextVarName("trans_out", status);

	if (name === "transition") {
		b.append(`const ${entryVarName} = ${getAnimationDetails(value, status)};`);
		b.append(`const ${exitVarName} = ${entryVarName};`);
		b.append(`t_animate(${varName}, ${entryVarName}, ${exitVarName});`);
	} else if (name === "transition:in") {
		let outAttribute = node.attributes.find((a) => a.name === "transition:out");
		if (outAttribute) {
			let outValue = trimMatched(outAttribute.value, "{", "}");
			b.append(`const ${entryVarName} = ${getAnimationDetails(value, status)};`);
			b.append(`const ${exitVarName} = ${getAnimationDetails(outValue, status)};`);
			b.append(`t_animate(${varName}, ${entryVarName}, ${exitVarName});`);
		} else {
			b.append(`const ${entryVarName} = ${getAnimationDetails(value, status)};`);
			b.append(`t_animate(${varName}, ${entryVarName});`);
		}
	} else if (name === "transition:out") {
		let inAttribute = node.attributes.find((a) => a.name === "transition:in");
		if (inAttribute) {
			// This has already been handled with transition:in, above
			return;
		} else {
			b.append(`const ${exitVarName} = ${getAnimationDetails(value, status)};`);
			b.append(`t_animate(${varName}, null, ${entryVarName});`);
		}
	} else {
		// TODO: Add an error
	}
}

function getAnimationDetails(value: string, status: BuildStatus) {
	// HACK: Split by commas, but not when in brackets
	let parts = [];
	let start = 0;
	let squareCount = 0;
	let curlyCount = 0;
	for (let i = 0; i < value.length; i++) {
		let char = value[i];
		switch (char) {
			case ",":
				if (squareCount === 0 && curlyCount === 0) {
					parts.push(value.substring(start, i));
					start = i + 1;
				}
				break;
			case "[":
				squareCount += 1;
				break;
			case "]":
				squareCount -= 1;
				break;
			case "{":
				curlyCount += 1;
				break;
			case "}":
				curlyCount -= 1;
				break;
		}
	}
	parts.push(value.substring(start));

	//let func = parts[0].trim();
	//let isAnimateFunction = func === "animate";
	//let options = isAnimateFunction ? parts[2]?.trim() : parts[1]?.trim();
	//let keyframes = isAnimateFunction ? parts[1]?.trim() : undefined;
	//if (isAnimateFunction) {
	//	status.imports.add("t_animate");
	//	func = "t_animate";
	//}

	let keyframes = parts[0]?.trim();
	let options = parts[1]?.trim();

	return `{ ${[`keyframes: ${keyframes}`, options ? `options: ${options}` : null].filter(Boolean).join(", ")} }`;
}
