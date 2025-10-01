import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import type BuildStatus from "./BuildStatus";

export default function buildScriptNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	b.append(`/* ${node.operation} */`);

	if (status.options?.mapped) {
		// TODO: replaceForVarNames is going to throw mapping out
		let startIndex = b.toString().length;
		let startLine = b.lineMap.length;
		b.append(`${maybeAppend(node.statement, ";")}`);
		let startChar = startIndex - b.lineMap.at(-1)!;
		let endIndex = startIndex + node.statement.length;
		let endLine = startLine;
		let endChar = endIndex - b.lineMap.at(-1)!;
		status.map.push({
			script: node.statement,
			source: node.range,
			compiled: { startIndex, startLine, startChar, endIndex, endLine, endChar },
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
