export default function getFragment(
	document: Document,
	array: DocumentFragment[],
	index: number,
	html: string,
	ns?: boolean,
): DocumentFragment {
	// Create the fragment in the array if it hasn't yet been used
	if (array[index] === undefined) {
		// TODO: Should pass a string for the ns, when we support other element types
		if (ns === true) {
			const template = document.createElementNS("http://www.w3.org/2000/svg", "template");
			template.innerHTML = html;
			const fragment = new DocumentFragment();
			fragment.append(...template.childNodes);
			array[index] = fragment;
		} else {
			const template = document.createElement("template");
			template.innerHTML = html;
			array[index] = template.content;
		}
	}

	// Get the fragment from the array
	// TODO: If we're hydrating we probably don't want to create and return a
	// fragment unless we really need to
	let fragment = array[index].cloneNode(true) as DocumentFragment;

	return fragment;
}
