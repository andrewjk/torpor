import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function buildScriptNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	b.append(`/* ${node.operation} */`);

	if (status.options?.mapped) {
		// TODO: replaceForVarNames is going to throw mapping out
		let start = b.toString().length;
		b.append(`${maybeAppend(node.statement, ";")}`);
		let end = start + node.statement.length;
		status.map.push({
			script: node.statement,
			source: node.range,
			compiled: { start, end },
		});
	} else {
		b.append(`${maybeAppend(node.statement, ";")}`);
	}
}

function maybeAppend(text: string, end: string) {
	if (!text.endsWith(end)) {
		text += end;
	}
	return text;
}
