//import type { Component } from "@torpor/view";
//import showPopover from "../Modal/showModal";
//
//interface ContextPopoverOptions {
//	popover: Component;
//	props?: Record<PropertyKey, any>;
//}
//
///**
// * A mount directive for showing a popover when the user opens an element's context menu.
// * @param node The element to show the popover for
// * @param options Options for showing the popover, consisting of the popover component and any props
// */
//export default function contextPopover(node: HTMLElement, options: ContextPopoverOptions) {
//	const { popover, props } = options;
//
//	// Add a contextmenu event handler to the node
//	node.addEventListener("contextmenu", handleClick);
//
//	function handleClick(e: MouseEvent) {
//		e.preventDefault();
//		show();
//	}
//
//	let div: HTMLDivElement;
//
//	function show() {
//		// Show the popover in a div
//		if (div) {
//			document.body.removeChild(div);
//		}
//		div = document.createElement("div");
//		document.body.appendChild(div);
//
//		showPopover(popover, node, props, div);
//	}
//
//	return {
//		destroy(): void {
//			// Remove the event listener from the node on destroy
//			node.removeEventListener("contextmenu", handleClick);
//
//			// Remove the div we added
//			// TODO: Should we do this in more places?
//			if (div) {
//				document.body.removeChild(div);
//			}
//		},
//	};
//}
//
