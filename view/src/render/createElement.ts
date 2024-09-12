export default function createElement(
	tagName: string,
	attributes: Record<string, string>,
	children: Node[],
) {
	let el = document.createElement(tagName);
	// Set any attributes that aren't reactive
	// Reactive attributes will be set in $run effects
	for (let [name, value] of Object.entries(attributes)) {
		if (!isReactiveAttribute(name, value)) {
			el.setAttribute(name, value);
		}
	}
	for (let child of children) {
		el.appendChild(child);
	}
	return el;
}

function isReactiveAttribute(name: string, value: string) {
	// HACK: Better checking of whether an attribute is reactive
	return (
		(name.startsWith("{") && name.endsWith("}")) ||
		(value.startsWith("{") && value.endsWith("}")) ||
		name.startsWith("on")
	);
}
