import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type RootNode from "../../types/nodes/RootNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";
import addMappedTextWithOffsets from "./addMappedTextWithOffsets";

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
		if (fragment.effects.length > 0) {
			status.imports.add("$run");
			b.append("$run(() => {");
			if (status.options.mapped === true) {
				for (let effect of fragment.effects) {
					addMappedTextWithOffsets(
						"",
						effect.functionBody,
						"",
						effect.spans,
						effect.offsets,
						effect.lengths,
						status,
						b,
					);
				}
			} else {
				b.append(fragment.effects.map((e) => e.functionBody).join("\n"));
			}
			b.append(`}${status.options.dev === true ? `, "setAttributes"` : ""});`);
		}
		if (fragment.singleRootElement) {
			// Single-root-element fast path: the cloned element is both the
			// fragment and the end node, so `t_add_element(node, parent,
			// before)` replaces `t_add_fragment(fragment, parent, before,
			// endNode)`. Saves the `firstChild` / `lastChild` reads and the
			// `DocumentFragment`-aware branches inside `t_add_fragment`.
			status.imports.add("t_add_element");
			b.append(
				`t_add_element(${fragment.endVarName ?? fragmentName}, ${parentName}, ${anchorName});`,
			);
			if (fragment.endVarName) {
				status.imports.add("t_next");
				b.append(`t_next(${fragment.endVarName});`);
			}
		} else {
			status.imports.add("t_add_fragment");
			let params = [fragmentName, parentName, anchorName];
			if (fragment.endVarName) {
				params.push(fragment.endVarName);
			}
			// Pass the root node so `addFragment` can restore the active
			// region's `startNode` during hydration. Child component rendering
			// (via `addElement`) overwrites `startNode` before `addFragment`
			// runs; without this, the region's bounds are wrong and slot
			// reuse clears the wrong parent.
			if (fragment.endVarName && fragment.rootVarName) {
				params.push(fragment.rootVarName);
			}
			b.append(`t_add_fragment(${params.join(", ")});`);
			// TODO: Don't need to do this if the last thing we hydrated was the end node
			if (fragment.endVarName) {
				status.imports.add("t_next");
				b.append(`t_next(${fragment.endVarName});`);
			}
		}
	}
}
