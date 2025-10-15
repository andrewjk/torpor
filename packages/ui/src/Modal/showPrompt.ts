import type { Component } from "@torpor/view";

/**
 * Shows a modal component in code, and asynchronously returns the value selected by the user.
 * @param modal The modal component
 * @param props The properties for the modal component
 * @param target The target element to show the modal in
 * @returns The value selected by the user
 */
export default function showPrompt(
	modal: Component,
	props?: Record<PropertyKey, any>,
	target?: Element,
): Promise<any> {
	return new Promise((resolve) => {
		// Add the promise as the callback
		const allProps = Object.assign({}, props, { callback: resolve });

		// Create the modal
		// TODO: This needs to clean up after itself, like the use methods do
		modal(target || document.body, null, allProps);
	});
}
