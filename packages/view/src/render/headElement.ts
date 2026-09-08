/**
 * Gets an element from the document head matching the selector, creating and
 * appending a new one if there isn't a match. Used by the code generated for
 * a @head block, so that elements which were server rendered (or rendered by
 * a previously visited page) are adopted rather than duplicated.
 */
export default function headElement(tagName: string, selector: string): Element {
	if (selector) {
		const existing = document.head.querySelector(selector);
		if (existing) {
			return existing;
		}
	}
	const element = document.createElement(tagName);
	document.head.appendChild(element);
	return element;
}
