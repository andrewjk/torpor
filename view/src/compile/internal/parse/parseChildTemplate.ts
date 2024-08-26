import parse from "../../parse";
import type Node from "../../types/nodes/Node";
import isElementNode from "../../types/nodes/isElementNode";
import isParentNode from "../../types/nodes/isParentNode";
import type ParseStatus from "./ParseStatus";
import slottifyComponentChildNodes from "./slottifyComponentChildNodes";

export default function parseChildTemplate(name: string, source: string, status: ParseStatus) {
	const parsed = parse(source);
	if (parsed.ok && parsed.template) {
		parsed.template.name = name;
		status.childTemplates = status.childTemplates || [];
		status.childTemplates.push(parsed.template);
		if (status.template) {
			setChildComponentNodes(name, status.template);
		}
	} else {
		status.errors = status.errors.concat(parsed.errors);
	}
}

function setChildComponentNodes(name: string, node: Node) {
	if (isElementNode(node) && node.tagName === name) {
		node.type = "component";
		slottifyComponentChildNodes(node);
	}
	if (isParentNode(node)) {
		for (let child of node.children) {
			setChildComponentNodes(name, child);
		}
	}
}
