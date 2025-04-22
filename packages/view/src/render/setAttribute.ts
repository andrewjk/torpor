export default function setAttribute(el: Element, name: string, value: any): void {
	if (value === false || value == null) {
		el.removeAttribute(name);
	} else {
		el.setAttribute(name, value);
	}
}
