import { type RootNode } from "../../types/nodes/RootNode";
import Builder from "../../utils/Builder";
import { type BuildServerStatus } from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerRootNode(
	node: RootNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	buildServerNode(node.children[0], status, b);
}
