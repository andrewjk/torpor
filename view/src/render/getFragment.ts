import context from "./context";

export default function getFragment(
	document: Document,
	array: DocumentFragment[],
	index: number,
	html: string,
): DocumentFragment {
	// Create the fragment in the array if it hasn't yet been used
	if (array[index] === undefined) {
		const template = document.createElement("template");
		template.innerHTML = html;
		array[index] = template.content;
	}

	// Get the fragment from the array
	// TODO: If we're hydrating we probably don't want to create and return a
	// fragment unless we really need to
	let fragment = array[index].cloneNode(true) as DocumentFragment;

	return fragment;
}
