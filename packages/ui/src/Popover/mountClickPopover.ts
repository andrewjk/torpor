import type { Component } from "@torpor/view";
import showPopover from "./showPopover";

interface ClickPopoverOptions {
	popover: Component;
	props?: Record<PropertyKey, any>;
}

/**
 * A mount directive for showing a popover when an element is clicked.
 * @param node The element to show the popover for
 * @param options Options for showing the popover, consisting of the popover component and any props
 */
export default function clickPopover(node: HTMLElement, options: ClickPopoverOptions) {
	const { popover, props } = options;

	// Add a click event handler to the node
	node.addEventListener("click", handleClick);

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		show();
	}

	let div: HTMLDivElement;

	function show() {
		// Show the popover in a div
		if (div) {
			document.body.removeChild(div);
		}
		div = document.createElement("div");
		document.body.appendChild(div);

		showPopover(popover, node, props, div);
	}

	return {
		destroy(): void {
			// Remove the event listener from the node on destroy
			node.removeEventListener("click", handleClick);

			// Remove the div we added
			// TODO: Should we do this in more places?
			if (div) {
				document.body.removeChild(div);
			}
		},
	};
}
