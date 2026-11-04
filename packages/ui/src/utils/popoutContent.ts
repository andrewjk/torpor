import { addDocumentEvent, removeDocumentEvent } from "./documentEvents";
import getScrollParent from "./getScrollParent";
import setPopoverPosition from "./setPopoverPosition";
import { suppressFocusOpen } from "./suppressFocusOpen";

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
	// Whether focus ever moved into the popout while it was shown. A
	// mouse-opened popover never takes focus, so it must not yank focus back to
	// its anchor when it hides.
	let hadFocus = false;
	let resizeObserver: ResizeObserver | null = null;

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

	/**
	 * Content often renders before its data (or images/layout) arrive, which
	 * changes the size the placement was computed from. Watch the content and
	 * reposition whenever it resizes while open.
	 */
	function observeContent() {
		if (typeof ResizeObserver === "undefined") return;
		const content = options.getContent();
		if (!content) return;
		resizeObserver ??= new ResizeObserver(() => {
			if (shown) setPosition();
		});
		resizeObserver.disconnect();
		resizeObserver.observe(content);
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

	function handleDocumentFocusIn(e: FocusEvent) {
		const content = options.getContent();
		if (content && content.contains(e.target as Node)) {
			hadFocus = true;
		}
	}

	function show() {
		shown = true;

		closeOnClick = false;
		hadFocus = false;
		addDocumentEvent("mousedown", handleDocumentMouseDown);
		addDocumentEvent("click", handleDocumentClick);
		addDocumentEvent("focusin", handleDocumentFocusIn);
		if (options.closeOnEscape) {
			addDocumentEvent("keydown", handleDocumentKeyDown);
		}

		// Set the position and listen for window resize and scroll to reset the position
		setPosition();
		observeContent();
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
		removeDocumentEvent("focusin", handleDocumentFocusIn);
		removeDocumentEvent("keydown", handleDocumentKeyDown);
		resizeObserver?.disconnect();
		removeEventListener("resize", setPosition);
		const anchor = options.getAnchor();
		if (anchor) {
			getScrollParent(anchor).removeEventListener("scroll", setPosition);
		}

		// Focus the anchor element again, per the WAI guidelines, when the
		// popout itself had focus. A mouse-opened hover popover never does, so
		// closing it must not steal focus (and show a focus ring). Focus that
		// has already moved elsewhere (e.g. to an adjacent menubar item's
		// menu) is left alone; focus that fell back to the body when the
		// focused content was removed still returns to the anchor.
		if (options.refocusAnchorOnHide) {
			const content = options.getContent();
			const active = document.activeElement;
			const focusInContent = content !== undefined && active !== null && content.contains(active);
			const focusFellBack = hadFocus && (active === null || active === document.body);
			if (focusInContent || focusFellBack) {
				const el = options.getAnchor();
				if (el) {
					// The refocus is script-driven, not user intent: arm the
					// guard so focus-to-open triggers (e.g. hover popovers)
					// don't immediately re-open
					suppressFocusOpen();
					el.focus();
				}
			}
		}
	}

	return { show, hide };
}
