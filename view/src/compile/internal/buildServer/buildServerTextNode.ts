import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";
import { trimQuotes } from "../utils";
import BuildServerStatus from "./BuildServerStatus";

export default function buildServerTextNode(node: TextNode, status: BuildServerStatus, b: Builder) {
	let content = node.content || "";
	// Replace all spaces with a single space, both to save space and to remove
	// newlines from generated JS strings
	content = content.replace(/\s+/g, " ");

	// TODO: Should be fancier about this in parse -- e.g. ignore braces in
	// quotes, unclosed, etc
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
		content = content.replaceAll("{", "${t_fmt(").replaceAll("}", ")}");
		status.output += content;
	} else {
		content = trimQuotes(content);
		status.output += `${content}`;
	}
}
