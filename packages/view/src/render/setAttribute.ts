export default function setAttribute(el: Element, name: string, value: any): void {
	if (value === false || value === undefined || value === null) {
		el.removeAttribute(name);
		if (name === "value") {
			// Keep the control's value in sync: removeAttribute only resets the
			// default, not what the control displays
			setValueProperty(el, "");
		}
		return;
	}

	if (name === "value") {
		// A form control's value is a property, not an attribute: setting the
		// `value` attribute only changes the default (a typed-into input keeps
		// its text) and on a <select> or <textarea> does nothing at all. The
		// property applies the value -- selecting the matching <option>, if any
		if (setValueProperty(el, String(value))) return;
	}

	el.setAttribute(name, value);
}

/** Sets the `value` property on a form control; returns false for other elements. */
function setValueProperty(el: Element, value: string): boolean {
	if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
		(el as HTMLInputElement).value = value;
		return true;
	}
	return false;
}
