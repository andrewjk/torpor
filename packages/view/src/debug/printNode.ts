export default function printNode(node: Node | null | undefined): string {
	if (!node) {
		return `\x1b[41m[null]\x1b[0m`;
	}

	let parent = node;
	while (parent?.parentNode) {
		if (parent.parentNode?.nodeType === 1 && parent.parentElement?.tagName === "BODY") {
			break;
		}
		parent = parent.parentNode;
	}

	let status = { p: "" };
	printChildNode(parent!, node!, status);

	return status.p;
}

function printChildNode(node: Node, target: Node, status: { p: string }) {
	if (node.nodeType === 1) {
		// Element
		let el = node as Element;
		let p = `<${el.tagName.toLowerCase()}>`;
		if (node === target) {
			p = `\x1b[44m${p}\x1b[0m`;
		}
		status.p += p;
	} else if (node.nodeType === 3) {
		// Text
		let p = "…";
		if (node === target) {
			p = `\x1b[44m${p}\x1b[0m`;
		}
		status.p += p;
	} else if (node.nodeType === 8) {
		// Comment
		let com = node as Comment;
		let p = `<!${com.data}>`;
		if (node === target) {
			p = `\x1b[44m${p}\x1b[0m`;
		}
		status.p += p;
	} else if (node.nodeType === 9) {
		// Document
	} else if (node.nodeType === 11) {
		// Document fragment
	} else {
	}

	for (let child of node.childNodes) {
		printChildNode(child, target, status);
	}

	if (node.nodeType === 1) {
		// Element
		let el = node as Element;
		let p = `</${el.tagName.toLowerCase()}>`;
		status.p += p;
	}
}
