// TODO: Allow passing in a variable -- so that you can show an inline popover
import type { Component } from "@torpor/view";

/**
 * Shows a popover component in code.
 * @param popover The popover component
 * @param anchor The element to use as an anchor for the popover component
 * @param props The properties for the popover component
 * @param target The target element to show the popover in
 * @returns The value selected by the user
 */
export default function showPopover(
	popover: Component,
	anchor: HTMLElement,
	props?: Record<PropertyKey, any>,
	target?: Element,
): void {
	// Add the anchor element to the properties
	const allProps = Object.assign({}, props, { anchor });

	// Create the popover
	// TODO: This needs to clean up after itself, like the mount methods do
	popover(target || anchor.parentElement || document.body, null, allProps);
}
