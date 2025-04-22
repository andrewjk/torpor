export default function createFragment(children: Node[]): DocumentFragment {
	let el = document.createDocumentFragment();
	for (let child of children) {
		el.appendChild(child);
	}
	return el;
}
