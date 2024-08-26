import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";
import buildRun from "./buildRun";

export default function buildTextNode(
	node: TextNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
) {
	let content = node.content || "";
	// Replace all spaces with a single space, both to save space and to remove newlines from generated JS strings
	content = content.replace(/\s+/g, " ");

	// TODO: Should be fancier about this in parse -- e.g. ignore braces in quotes, unclosed, etc
	let reactiveStarted = false;
	let reactiveCount = 0;
	for (let i = 0; i < content.length; i++) {
		if (content[i] === "{") {
			reactiveStarted = true;
		} else if (content[i] === "}") {
			if (reactiveStarted) {
				reactiveCount += 1;
				reactiveStarted = false;
			}
		}
	}

	if (reactiveCount) {
		status.imports.add("t_fmt");
		if (reactiveCount === 1 && content.startsWith("{") && content.endsWith("}")) {
			content = `t_fmt(${content.substring(1, content.length - 1)})`;
		} else {
			content = `\`${content.replaceAll("{", "${t_fmt(").replaceAll("}", ")}")}\``;
		}
		buildRun("setTextContent", `${node.varName}.textContent = ${content};`, status, b);
	}
}
