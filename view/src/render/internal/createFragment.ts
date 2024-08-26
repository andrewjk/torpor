export default function createFragment(children: Node[]) {
	let el = document.createDocumentFragment();
	for (let child of children) {
		el.appendChild(child);
	}
	return el;
}
