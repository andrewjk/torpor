import { type ElementNode } from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import { type BuildStatus } from "./BuildStatus";
import buildNode from "./buildNode";

export default function buildHeadNode(node: ElementNode, status: BuildStatus, b: Builder) {
	b.append("");
	b.append("/* @head */");

	status.inHead = true;
	for (let child of node.children) {
		buildNode(child, status, b, "undefined", "undefined");
	}
	status.inHead = false;

	b.append("");
}
