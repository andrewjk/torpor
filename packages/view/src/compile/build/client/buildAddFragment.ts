import { type ControlNode } from "../../types/nodes/ControlNode";
import { type ElementNode } from "../../types/nodes/ElementNode";
import { type RootNode } from "../../types/nodes/RootNode";
import Builder from "../../utils/Builder";
import { type BuildStatus } from "./BuildStatus";

export default function buildAddFragment(
	node: RootNode | ControlNode | ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
): void {
	if (node.fragment) {
		const fragment = node.fragment;
		const fragmentName = `t_fragment_${fragment.number}`;
		status.imports.add("t_add_fragment");
		let params = [fragmentName, parentName, anchorName];
		if (fragment.endVarName) {
			params.push(fragment.endVarName);
		}
		b.append(`t_add_fragment(${params.join(", ")});`);
		// TODO: Don't need to do this if the last thing we hydrated was the end node
		if (fragment.endVarName) {
			status.imports.add("t_next");
			b.append(`t_next(${fragment.endVarName});`);
		}
	}
}
