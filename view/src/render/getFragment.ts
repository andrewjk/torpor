import context from "./context";

export default function getFragment(
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

	// Set the start node of the active range to the first node in the fragment
	// The end node will be set when we add the fragment
	// If we're hydrating, the start node will be set when we call nodeRoot
	if (!context.hydrationNode && context.activeRange && !context.activeRange.startNode) {
		context.activeRange.startNode = fragment.firstChild;
	}

	return fragment;
}
