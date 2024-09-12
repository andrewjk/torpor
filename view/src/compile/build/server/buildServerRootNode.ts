import Builder from "../../Builder";
import type RootNode from "../../types/nodes/RootNode";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerRootNode(node: RootNode, status: BuildServerStatus, b: Builder) {
	buildServerNode(node.children[0], status, b);
}
