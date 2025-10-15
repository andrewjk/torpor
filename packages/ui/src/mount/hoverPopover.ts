//import type { Component } from "@torpor/view";
//import showPopover from "../Modal/showModal";
//import hoverTrigger from "./hoverTrigger";
//
//interface HoverPopoverOptions {
//	popover: Component;
//	props?: Record<PropertyKey, any>;
//	hoverDelay?: number;
//	touchDelay?: number;
//}
//
///**
// * A mount directive for showing a popover when an element is hovered.
// * @param node The element to show the popover for
// * @param options Options for showing the popover, consisting of the popover component, any props and delays for hover and touch
// */
//export default function hoverPopover(node: HTMLElement, options: HoverPopoverOptions): () => void {
//	const { popover, props, hoverDelay, touchDelay } = options;
//
//	let div: HTMLDivElement | undefined;
//
//	function onHover(node: HTMLElement, e: MouseEvent | TouchEvent) {
//		// Show the popover in a div
//		if (div) {
//			document.body.removeChild(div);
//		}
//		div = document.createElement("div");
//		document.body.appendChild(div);
//
//		// Get the position relative to the element, so we can reposition on scroll
//		const rect = node.getBoundingClientRect();
//		let position: { x: number; y: number };
//		if (e.type.startsWith("mouse")) {
//			const me = e as MouseEvent;
//			position = { x: me.clientX - rect.left, y: me.clientY - rect.top };
//		} else {
//			const te = e as TouchEvent;
//			position = {
//				x: te.touches[0].clientX - rect.left,
//				y: te.touches[0].clientY - rect.top,
//			};
//		}
//		const allProps = Object.assign({}, props, { anchor: node, position });
//
//		showPopover(popover, node, allProps, div);
//	}
//
//	function onExit() {
//		// Remove the div
//		if (div) {
//			document.body.removeChild(div);
//			div = undefined;
//		}
//	}
//
//	return hoverTrigger(node, { onHover, onExit, hoverDelay, touchDelay });
//}
//
