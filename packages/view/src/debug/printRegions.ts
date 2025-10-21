import context from "../render/context";
import type Region from "../types/Region";

/**
 * Creates a description of all the regions in the context, from the root region
 * onward.
 */
export default function printRegions(container: HTMLElement): string {
	let region: Region | null = context.rootRegion;
	let lines: string[] = [];
	let i = 1;
	while (region !== null && i < 100) {
		lines.push(`RANGE ${i++} - ${region.name}`);
		lines.push(printRegion(container, region.startNode, region.endNode));
		region = region.nextRegion;
	}
	return lines.join("\n");
}

function printRegion(container: Node, startNode: ChildNode | null, endNode: ChildNode | null) {
	let rt = {
		line1: "",
		line2: "",
	};

	printRegionNode(container, startNode, endNode, rt);

	return rt.line1 + "\n" + rt.line2;
}

function printRegionNode(
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
			printRegionNode(cnode, startNode, endNode, rt);
		}

		rt.line1 += `</${el.tagName.toLowerCase()}>`;
		if (node === startNode || node === endNode) {
			rt.line2 += `${"─".repeat(el.tagName.length + 1)}┘`;
		} else {
			rt.line2 += " ".repeat(el.tagName.length + 3);
		}
	} else if (node.nodeType === Node.TEXT_NODE) {
		let el = node as Text;
		let text = el.textContent ?? "";
		rt.line1 += `«${text}»`;
		if (node === startNode || node === endNode) {
			rt.line2 += `└${"─".repeat(text.length)}┘`;
		} else {
			rt.line2 += " ".repeat(text.length + 2);
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
