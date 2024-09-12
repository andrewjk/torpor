import Builder from "../../Builder";
import type ElementNode from "../../types/nodes/ElementNode";
import { trimMatched } from "../../utils/trimMatched";
import { trimQuotes } from "../../utils/trimQuotes";
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
	let tagAttribute = node.attributes.find((a) => a.name === "tag");
	if (tagAttribute) {
		status.imports.add("$run");
		status.imports.add("t_dynamic");
		let tagValue = trimMatched(tagAttribute.value, "{", "}");
		b.append(`$run(function setDynamic() {`);
		b.append(`${node.varName} = t_dynamic(${node.varName}, ${tagValue});`);

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
	for (let { name, value } of node.attributes) {
		if (name === "tag" && node.tagName === ":element") {
			// Ignore this special attribute
		} else if (name.startsWith("{") && name.endsWith("}")) {
			name = name.substring(1, name.length - 1);
			buildRun("setAttribute", `${varName}.setAttribute("${name}", ${name});`, status, b);
		} else if (name.startsWith("on")) {
			value = trimMatched(value, "{", "}");

			// HACK: If a value from a for loop is used in the function body,
			// get it from the loop data
			for (let varName of status.forVarNames) {
				value = value.replaceAll(
					new RegExp(`([\\s\\(\\[])${varName}([\\s\\.\\(\\)\\[\\];])`, "g"),
					`$1t_item.data.${varName}$2`,
				);
			}

			// Add an event listener
			const eventName = name.substring(2);

			const fragment = status.fragmentStack[status.fragmentStack.length - 1].fragment;
			if (fragment) {
				fragment.events.push({ varName, eventName, handler: value });
			}
		} else if (value.startsWith("{") && value.endsWith("}")) {
			value = value.substring(1, value.length - 1);

			if (name === "bind:this") {
				// Bind the DOM element to a user-defined variable
				b.append(`${value} = ${varName};`);
			} else if (name === "bind:group") {
				// Automatically add an event to bind the value
				// TODO: Only tested this with radio buttons
				let eventName = "change";
				let inputValue = node.attributes.find((a) => a.name === "value")?.value;
				let set = `${value} == ${inputValue}`;
				let propName = "checked";
				const setAttribute = `${varName}.${propName} = ${set}`;
				buildRun("setBinding", `${setAttribute};`, status, b);
				// TODO: Add a parseInput method that handles NaN etc
				b.append(`${varName}.addEventListener("${eventName}", (e) => {
					if (e.target.${propName}) ${value} = ${inputValue};
				});`);
			} else if (name.indexOf("bind:") === 0) {
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
				b.append(`${varName}.addEventListener("${eventName}", (e) => ${value} = ${inputValue});`);
			} else if (name.indexOf("class:") === 0) {
				const propName = name.substring(6);
				const setAttribute = `${varName}.classList.toggle("${propName}", ${value})`;
				buildRun("setClassList", `${setAttribute};`, status, b);
			} else if (name === "class") {
				buildRun("setClassName", `${varName}.className = ${value};`, status, b);
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
