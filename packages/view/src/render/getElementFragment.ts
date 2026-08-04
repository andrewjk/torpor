/**
 * Returns a clone of the cached template's single root element, bypassing the
 * `DocumentFragment` wrapper that `getFragment` produces.
 *
 * Used by the compiler-emitted `createListItem` for `@for` bodies (and other
 * fragments) whose template has exactly one rendering root child — e.g.
 * `<tr><td>...</td>...</tr>`. Cloning `template.content.firstElementChild`
 * directly saves the per-row `DocumentFragment` allocation that `getFragment`'s
 * `cloneNode(true)` on the cached template's content would otherwise produce,
 * which dominates the cost of bulk-row creates (`run`/`add`/`runlots`).
 *
 * Contract: the compiler only emits `t_fragment_el` for fragment indices whose
 * template has exactly one rendering root, and that root is an `Element`. The
 * cache array (`t_fragment_els`) is separate from `t_fragments` so each helper
 * only ever sees its own cached type at a given index.
 *
 * @param document The owner document (used to build the cached `<template>`).
 * @param array The per-component `t_fragment_els` cache.
 * @param index The fragment's index in the cache.
 * @param html The fragment's HTML source, with `#` placeholders for reactive
 *   text and `<!>` for anchor comments.
 * @param ns When true, the template is created in the SVG namespace (its
 *   `firstElementChild` is then an SVG element).
 */
export default function getElementFragment(
	document: Document,
	array: Element[],
	index: number,
	html: string,
	ns?: boolean,
): Element {
	// Create the cached element if it hasn't yet been used
	if (array[index] === undefined) {
		// TODO: Should pass a string for the ns, when we support other element types
		if (ns === true) {
			const template = document.createElementNS("http://www.w3.org/2000/svg", "template");
			template.innerHTML = html;
			array[index] = template.firstElementChild!;
		} else {
			const template = document.createElement("template");
			template.innerHTML = html;
			array[index] = template.content.firstElementChild!;
		}
	}

	return array[index]!.cloneNode(true) as Element;
}
