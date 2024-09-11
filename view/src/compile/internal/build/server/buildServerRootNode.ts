import type RootNode from "../../../types/nodes/RootNode";
import Builder from "../../Builder";
import BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";

export default function buildServerRootNode(node: RootNode, status: BuildServerStatus, b: Builder) {
	buildServerNode(node.children[0], status, b);
}
