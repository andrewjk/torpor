/**
 * Measures an element before it is added to the DOM
 * @param el The element to measure
 * @param fn The function to use to get the desired measurement (e.g. el.offsetHeight)
 */
export default function measure(el: HTMLElement, fn: (_: HTMLElement) => number): number {
	// From https://stackoverflow.com/a/46707458
	let oldVisibility = el.style.visibility;
	let oldPosition = el.style.position;

	let oldParent = el.parentNode;
	let oldBefore = el.nextSibling;

	el.style.visibility = "hidden";
	el.style.position = "absolute";

	document.body.appendChild(el);
	let result = fn(el);
	el.parentNode!.removeChild(el);

	if (oldParent !== null) {
		oldParent.insertBefore(el, oldBefore);
		el.style.visibility = oldVisibility;
		el.style.position = oldPosition;
	}

	return result;
}
