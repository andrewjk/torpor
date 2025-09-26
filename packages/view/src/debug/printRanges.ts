import context from "../render/context";
import type Range from "../types/Range";

/**
 * Creates a description of all the ranges in the context, from the root range
 * onward.
 */
export default function printRanges(container: HTMLElement): string {
	let range: Range | null = context.rootRange;
	let lines: string[] = [];
	let i = 1;
	while (range !== null && i < 100) {
		lines.push(`RANGE ${i++} - ${range.name}`);
		lines.push(printRange(container, range.startNode, range.endNode));
		range = range.nextRange;
	}
	return lines.join("\n");
}

function printRange(container: Node, startNode: ChildNode | null, endNode: ChildNode | null) {
	let rt = {
		line1: "",
		line2: "",
	};

	printRangeNode(container, startNode, endNode, rt);

	return rt.line1 + "\n" + rt.line2;
}

function printRangeNode(
	node: Node,
	startNode: ChildNode | null,
	endNode: ChildNode | null,
	rt: { line1: string; line2: string },
) {
	if (node.nodeType === Node.ELEMENT_NODE) {
		let el = node as HTMLElement;
		rt.line1 += `<${el.tagName.toLowerCase()}>`;
		if (node === startNode || node === endNode) {
			rt.line2 += `└${"─".repeat(el.tagName.length)}`;
		} else {
			rt.line2 += " ".repeat(el.tagName.length + 2);
		}

		for (let cnode of node.childNodes) {
			printRangeNode(cnode, startNode, endNode, rt);
		}

		rt.line1 += `</${el.tagName.toLowerCase()}>`;
		if (node === startNode || node === endNode) {
			rt.line2 += `${"─".repeat(el.tagName.length + 1)}┘`;
		} else {
			rt.line2 += " ".repeat(el.tagName.length + 3);
		}
	} else if (node.nodeType === Node.TEXT_NODE) {
		let el = node as Text;
		rt.line1 += `«${el.textContent}»`;
		if (node === startNode || node === endNode) {
			rt.line2 += `└${"─".repeat(el.textContent.length)}┘`;
		} else {
			rt.line2 += " ".repeat(el.textContent.length + 2);
		}
	} else if (node.nodeType === Node.COMMENT_NODE) {
		rt.line1 += `<!>`;
		if (node === startNode || node === endNode) {
			rt.line2 += node === startNode ? "1-" : "2-";
			rt.line2 += " ";
		} else {
			rt.line2 += "   ";
		}
	}
}
