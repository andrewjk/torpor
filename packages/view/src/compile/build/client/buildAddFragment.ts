import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type RootNode from "../../types/nodes/RootNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

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
		if (fragment.effects.length > 0) {
			// TODO: nicer mapping
			status.imports.add("$run");
			b.append(`$run(function setAttributes() {`);
			if (status.options?.mapped) {
				for (let effect of fragment.effects) {
					for (let i = 0; i < effect.ranges.length; i++) {
						let startIndex = b.toString().length + effect.offsets[i];
						let startLine = b.lineMap.length;
						b.append(effect.functionBody);
						let startChar = startIndex - b.lineMap.at(-1)!;
						let endIndex = startIndex + effect.lengths[i];
						let endLine = startLine;
						let endChar = endIndex - b.lineMap.at(-1)!;
						status.map.push({
							script: effect.functionBody,
							source: effect.ranges[i],
							compiled: { startIndex, startLine, startChar, endIndex, endLine, endChar },
						});
					}
				}
			} else {
				b.append(fragment.effects.map((e) => e.functionBody).join("\n"));
			}
			b.append("});");
		}
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
