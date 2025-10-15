// TODO: Allow passing in a variable -- so that you can show an inline modal
import type { Component } from "@torpor/view";

/**
 * Shows a modal component in code.
 * @param modal The modal component
 * @param props The properties for the modal component
 * @param target The target element to show the modal in
 * @returns The value selected by the user
 */
export default function showModal(
	modal: Component,
	props?: Record<PropertyKey, any>,
	target?: Element,
): void {
	// Create the modal
	// TODO: This needs to clean up after itself, like the mount methods do
	modal(target || document.body, null, props);
}
