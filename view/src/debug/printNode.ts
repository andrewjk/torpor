export default function printNode(node: Node | null | undefined) {
	let textContent = node?.textContent;
	let paths: string[] = [];

	while (node != null) {
		if (node.nodeType === 1) {
			// Element
			let el = node as Element;
			let p = el.tagName.toLowerCase();
			if (el.id) p += "#" + el.id;
			if (el.classList.length) p += "." + Array.from(el.classList).join(".");
			if (node.parentNode) p += `[${Array.from(node.parentNode.childNodes).indexOf(el)}]`;
			paths.push(p);
		} else if (node.nodeType === 3) {
			// Text
			let txt = node as Text;
			let p = `'${txt.textContent}'`;
			if (node.parentNode) p += `[${Array.from(node.parentNode.childNodes).indexOf(txt)}]`;
			paths.push(p);
		} else if (node.nodeType === 8) {
			// Comment
			let com = node as Comment;
			let p = `<!${com.data}>`;
			if (node.parentNode) p += `[${Array.from(node.parentNode.childNodes).indexOf(com)}]`;
			paths.push(p);
		} else if (node.nodeType === 9) {
			// Document
			paths.push("#doc");
		} else if (node.nodeType === 11) {
			// Document fragment
			paths.push("#frag");
		} else {
			paths.push(node.nodeType + "?");
		}
		node = node.parentNode;
	}

	return `[ ${paths.reverse().join(" > ") || "null"} -- '${truncate(textContent || "", 40)}' ]`;
}

function truncate(input: string, length: number) {
	return input.length > length ? `${input.substring(0, length)}…` : input;
}
