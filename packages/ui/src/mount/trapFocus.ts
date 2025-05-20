export interface TrapFocusOptions {
	focusableElements: HTMLElement[];
}

export function trapFocus(node: HTMLElement, options?: TrapFocusOptions): () => void {
	options = options || { focusableElements: [] };

	// Selectors for all things that are focusable:
	const focusableSelectors = [
		"a[href]",
		"area[href]",
		'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
		"select:not([disabled]):not([aria-hidden])",
		"textarea:not([disabled]):not([aria-hidden])",
		"button:not([disabled]):not([aria-hidden])",
		"iframe",
		"object",
		"embed",
		"[contenteditable]",
		'[tabindex]:not([tabindex^="-"])',
	];

	// Set the focusable elements array in the options, which can be used in the caller e.g. to focus the first element
	options.focusableElements = Array.from(node.querySelectorAll(focusableSelectors.join()));

	// Store first and last focusable elements
	const firstFocusableElement = options.focusableElements[0] as HTMLElement;
	const lastFocusableElement = options.focusableElements[
		options.focusableElements.length - 1
	] as HTMLElement;

	// Add the keydown event listener to the node
	node.addEventListener("keydown", handleKey);

	// On Tab or Shift+Tab, move through the focusable elements, wrapping at either end
	function handleKey(e: KeyboardEvent) {
		if (e.key === "Tab") {
			if (e.shiftKey) {
				if (document.activeElement === firstFocusableElement) {
					// Shift + Tab on the first element, so move to the last one
					lastFocusableElement.focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === lastFocusableElement) {
					// Tab on the last element, so move to the first one
					firstFocusableElement.focus();
					e.preventDefault();
				}
			}
		}
	}

	// Remove the keydown event listener from the node on destroy
	return () => {
		node.removeEventListener("keydown", handleKey);
	};
}
