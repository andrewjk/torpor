import { addDocumentEvent, removeDocumentEvent } from "./documentEvents";
import getScrollParent from "./getScrollParent";
import setPopoverPosition from "./setPopoverPosition";

export interface PopoutContentOptions {
	/** Resolves the element to position the content against */
	getAnchor: () => HTMLElement | undefined;
	/** Resolves the content element */
	getContent: () => HTMLElement | undefined;
	/** Closes the popout (e.g. by setting visible to false) */
	close: (e: MouseEvent | KeyboardEvent) => void;
	/** Where to show the content, relative to the anchor */
	side?: "top" | "right" | "bottom" | "left";
	/** How to align the content, relative to the anchor */
	alignment?: "start" | "center" | "end";
	/** Custom positioning, as an alternative to side/alignment */
	position?: () => void;
	/** Whether pressing Escape closes the popout */
	closeOnEscape?: boolean;
	/** Only close on Escape when the focus is inside the content */
	escapeOnlyWhenFocused?: boolean;
	/** Ignore clicks on the anchor element when closing on outside clicks */
	ignoreAnchorClicks?: boolean;
	/** Called after the content is shown, to set focus for accessibility */
	focusFirstElement?: () => void;
	/** Focus the anchor element after hiding */
	refocusAnchorOnHide?: boolean;
}

/**
 * Shared show/hide machinery for popout content components: outside click
 * handling, Escape handling, repositioning on scroll/resize and focus
 * management.
 *
 * HACK: Because the popout could be shown with a click, we need to wait for
 * another mousedown before we close on click. Otherwise the click that opened
 * the popout immediately bubbles to the document and closes it again.
 */
export function createPopoutContent(options: PopoutContentOptions): {
	show: () => void;
	hide: () => void;
} {
	let shown = false;
	let closeOnClick = false;

	function setPosition() {
		const anchor = options.getAnchor();
		const content = options.getContent();
		if (!anchor || !content) return;

		if (options.position) {
			options.position();
		} else {
			setPopoverPosition(anchor, content, options.side ?? "bottom", options.alignment ?? "start");
		}
	}

	function handleDocumentMouseDown() {
		closeOnClick = true;
	}

	function handleDocumentClick(e: MouseEvent) {
		const content = options.getContent();
		const anchor = options.getAnchor();
		if (!closeOnClick || !content || content.contains(e.target as HTMLElement)) {
			return;
		}
		if (options.ignoreAnchorClicks && anchor?.contains(e.target as HTMLElement)) {
			return;
		}
		e.preventDefault();
		options.close(e);
	}

	function handleDocumentKeyDown(e: KeyboardEvent) {
		if (e.key !== "Escape") return;
		const content = options.getContent();
		if (options.escapeOnlyWhenFocused && content && !content.contains(e.target as Node)) {
			return;
		}
		e.preventDefault();
		options.close(e);
	}

	function show() {
		shown = true;

		closeOnClick = false;
		addDocumentEvent("mousedown", handleDocumentMouseDown);
		addDocumentEvent("click", handleDocumentClick);
		if (options.closeOnEscape) {
			addDocumentEvent("keydown", handleDocumentKeyDown);
		}

		// Set the position and listen for window resize and scroll to reset the position
		setPosition();
		addEventListener("resize", setPosition);
		const anchor = options.getAnchor();
		if (anchor) {
			getScrollParent(anchor).addEventListener("scroll", setPosition);
		}

		options.focusFirstElement?.();
	}

	function hide() {
		if (!shown) return;
		shown = false;

		removeDocumentEvent("mousedown", handleDocumentMouseDown);
		removeDocumentEvent("click", handleDocumentClick);
		removeDocumentEvent("keydown", handleDocumentKeyDown);
		removeEventListener("resize", setPosition);
		const anchor = options.getAnchor();
		if (anchor) {
			getScrollParent(anchor).removeEventListener("scroll", setPosition);
		}

		// Focus the anchor element again, per the WAI guidelines
		if (options.refocusAnchorOnHide) {
			const el = options.getAnchor();
			el?.focus?.();
		}
	}

	return { show, hide };
}
