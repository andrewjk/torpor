import Builder from "../../Builder";
import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type RootNode from "../../types/nodes/RootNode";
import type BuildStatus from "./BuildStatus";
import buildRun from "./buildRun";

export default function buildAddFragment(
	node: RootNode | ControlNode | ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
) {
	if (node.fragment) {
		const fragment = node.fragment;
		const fragmentName = `t_fragment_${fragment.number}`;
		status.imports.add("t_add_fragment");
		b.append(`t_add_fragment(${fragmentName}, ${parentName}, ${anchorName});`);
		// TODO: Don't need to do this if the last thing we hydrated was the end node
		if (fragment.endVarName && node.children.length > 1) {
			status.imports.add("t_next");
			b.append(`t_next(${fragment.endVarName});`);
		}
	}
}
