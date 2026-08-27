/**
 * Shared hover-to-reveal behavior for hover-activated popout triggers
 * (PopoverHover, ContextualHover).
 *
 * Unlike press activation, hover needs:
 * - an intent delay before opening, so passing over an element doesn't flash
 *   a popout (mirrors createHoverOpen for menu items)
 * - an exit grace period after leaving, so moving the pointer from the
 *   trigger into the popout content doesn't close it -- entering the content
 *   cancels a pending close entirely
 */

export interface HoverRevealOptions {
	/** Shows the popout */
	show: () => void;
	/** Hides the popout */
	hide: () => void;
	/** Whether the popout is currently visible */
	isVisible: () => boolean;
	/** Whether hover interaction is ignored entirely */
	disabled?: () => boolean;
	/** The popout content element, for keeping it open when hovered */
	getContent?: () => HTMLElement | null | undefined;
	/** Milliseconds to wait before opening (default 500; 0 opens immediately) */
	hoverDelay?: number;
	/** Milliseconds to wait after the pointer leaves before closing (default 300) */
	exitGrace?: number;
}

export interface HoverRevealHandlers {
	/** Handles the pointer entering the trigger */
	handleEnter: () => void;
	/** Handles the pointer leaving the trigger; closes unless it moved into the content element */
	handleLeave: (e: MouseEvent | FocusEvent) => void;
	/** Handles focus landing on the trigger (opens immediately) */
	handleFocus: () => void;
	/** Handles focus leaving the trigger (closes unless focus moved into the content element) */
	handleBlur: (e: FocusEvent) => void;
	/** Cancels pending open/close timers */
	dispose: () => void;
}

export function createHoverReveal(options: HoverRevealOptions): HoverRevealHandlers {
	const show = options.show;
	const hide = options.hide;
	const isVisible = options.isVisible;
	const disabled = options.disabled ?? (() => false);
	const getContent = options.getContent ?? (() => undefined);
	const hoverDelay = options.hoverDelay ?? 500;
	const exitGrace = options.exitGrace ?? 300;

	let openTimer: ReturnType<typeof setTimeout> | undefined;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	let suppressFocusOpen = false;

	function clearTimers() {
		if (openTimer !== undefined) {
			clearTimeout(openTimer);
			openTimer = undefined;
		}
		if (closeTimer !== undefined) {
			clearTimeout(closeTimer);
			closeTimer = undefined;
		}
	}

	function cancelPendingOpen() {
		if (openTimer !== undefined) {
			clearTimeout(openTimer);
			openTimer = undefined;
		}
	}

	/** While armed, moving into the content cancels the close */
	function scheduleClose() {
		if (closeTimer !== undefined) return;

		closeTimer = setTimeout(() => {
			closeTimer = undefined;
			stopListening();
			// The content hides with `refocusAnchorOnHide`, which drops
			// focus back onto this trigger -- that is not user intent,
			// so swallow the one focus-driven open that follows
			suppressFocusOpen = true;
			hide();
		}, exitGrace);

		// Cancel as soon as the pointer or focus lands on the content
		document.addEventListener("mouseover", handleDocumentOver);
		document.addEventListener("focusin", handleDocumentFocusIn);
	}

	function stopListening() {
		document.removeEventListener("mouseover", handleDocumentOver);
		document.removeEventListener("focusin", handleDocumentFocusIn);
	}

	function handleDocumentFocusIn(e: FocusEvent) {
		if (closeTimer === undefined) {
			stopListening();
			return;
		}
		if (insideContent(e.target)) {
			clearTimeout(closeTimer);
			closeTimer = undefined;
			stopListening();
		}
	}

	function handleDocumentOver(e: MouseEvent) {
		if (closeTimer === undefined) {
			document.removeEventListener("mouseover", handleDocumentOver);
			return;
		}
		if (insideContent(e.target)) {
			clearTimeout(closeTimer);
			closeTimer = undefined;
			document.removeEventListener("mouseover", handleDocumentOver);
		}
	}

	function insideContent(target: EventTarget | null): boolean {
		const content = getContent();
		if (!content || !target) return false;
		return content === target || content.contains(target as Node);
	}

	return {
		handleEnter() {
			if (disabled()) return;

			if (closeTimer !== undefined) {
				clearTimeout(closeTimer);
				closeTimer = undefined;
				stopListening();
			}
			if (isVisible()) return;

			if (hoverDelay <= 0) {
				show();
				return;
			}
			if (openTimer === undefined) {
				openTimer = setTimeout(() => {
					openTimer = undefined;
					show();
				}, hoverDelay);
			}
		},

		handleLeave(_e) {
			if (disabled()) return;

			// Just a pass-over: cancel the pending open and stay closed
			if (openTimer !== undefined) {
				cancelPendingOpen();
				return;
			}
			if (!isVisible()) return;

			scheduleClose();
		},

		handleFocus() {
			if (disabled()) return;

			if (suppressFocusOpen) {
				suppressFocusOpen = false;
				return;
			}

			if (closeTimer !== undefined) {
				clearTimeout(closeTimer);
				closeTimer = undefined;
				stopListening();
			}
			if (!isVisible()) {
				show();
			}
		},

		handleBlur(_e) {
			if (disabled()) return;
			if (!isVisible()) return;

			scheduleClose();
		},

		dispose() {
			clearTimers();
			stopListening();
		},
	};
}
