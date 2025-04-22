import { type RootNode } from "../../types/nodes/RootNode";
import Builder from "../../utils/Builder";
import { type BuildStatus } from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";

export default function buildRootNode(
	node: RootNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
): void {
	buildFragment(node, status, b, parentName, anchorName);

	status.fragmentStack.push({
		fragment: node.fragment,
		path: "0:ch/",
	});
	buildNode(node.children[0], status, b, parentName, anchorName, true);
	status.fragmentStack.pop();

	buildAddFragment(node, status, b, parentName, anchorName);
}
