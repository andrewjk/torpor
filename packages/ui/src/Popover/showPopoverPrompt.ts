import type { Component } from "@torpor/view";

/**
 * Shows a popover component in code, and asynchronously returns the value selected by the user.
 * @param popover The popover component
 * @param props The properties for the popover component
 * @param target The target element to show the popover in
 * @returns The value selected by the user
 */
export default function showPopoverPrompt(
	popover: Component,
	props?: Record<PropertyKey, any>,
	target?: Element,
): Promise<void> {
	return new Promise((resolve) => {
		// Add the promise as the callback
		const allProps = Object.assign({}, props, { callback: resolve });

		// Create the popover
		// TODO: This needs to clean up after itself, like the use methods do
		popover(target || document.body, null, allProps);
	});
}
