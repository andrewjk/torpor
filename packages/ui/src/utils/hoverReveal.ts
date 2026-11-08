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

import { consumeFocusOpenSuppress } from "./suppressFocusOpen";

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
	/**
	 * How taps on touch screens open the popout (hover never fires on touch).
	 * - "auto" (default): tapping the trigger's inert surface opens it;
	 *   tapping an interactive control inside the trigger (a button, link,
	 *   …) runs the control's action and does NOT open the popout.
	 * - "open": any tap opens it, even over embedded controls — for pure
	 *   hovercards whose content is the whole point.
	 * - "ignore": taps never open it — the component provides its own touch
	 *   trigger.
	 */
	touchBehavior?: "auto" | "open" | "ignore";
}

export interface HoverRevealHandlers {
	/**
	 * Handles the pointer entering the trigger. Returns false when the enter
	 * was suppressed (a touch tap that shouldn't open the popout), so callers
	 * with their own enter bookkeeping (e.g. Contextual's anchor positioning)
	 * can skip it too.
	 */
	handleEnter: () => boolean;
	/** Handles the pointer leaving the trigger; closes unless it moved into the content element */
	handleLeave: (e: MouseEvent | FocusEvent) => void;
	/** Handles focus landing on the trigger (opens immediately) */
	handleFocus: () => void;
	/** Handles focus leaving the trigger (closes unless focus moved into the content element) */
	handleBlur: (e: FocusEvent) => void;
	/**
	 * Handles a pointerdown on the trigger. Touch taps synthesize the
	 * mouseenter/focus sequence the hover machine reacts to — but a tap on an
	 * interactive control is an *action*, not a request to see the popout, so
	 * this records the modality and target for `handleEnter`/`handleFocus` to
	 * discriminate (the compatibility mouse events carry no pointerType, and
	 * focus carries none at all).
	 */
	handlePointerDown: (e: PointerEvent) => void;
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
	const touchBehavior = options.touchBehavior ?? "auto";

	let openTimer: ReturnType<typeof setTimeout> | undefined;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	// The last touch/pen pointerdown on the trigger: a tap synthesizes the
	// mouseenter and focus the machine reacts to, so the pointerdown is the
	// only place where the input modality — and the tapped control — is
	// observable. Time-boxed rather than reset manually, so a stale tap can't
	// suppress a later real mouse hover for more than a moment.
	const TOUCH_WINDOW = 1000;
	let touchTapAt = 0;
	let touchTapInteractive = false;

	// Controls whose activation is an action in its own right: tapping them
	// must not also reveal the popout ("don't punish the action"). Inert
	// surfaces fall through, so the tap fallback still works for pure content.
	const INTERACTIVE =
		"button, a, input, select, textarea, label, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='option'], [role='checkbox'], [role='radio'], [role='switch']";

	function touchSuppressesEnter(): boolean {
		if (Date.now() - touchTapAt > TOUCH_WINDOW) return false;
		if (touchBehavior === "open") return false;
		if (touchBehavior === "ignore") return true;
		return touchTapInteractive;
	}

	/**
	 * Focus is only suppressed in "ignore" mode: in "auto", a tap on an
	 * embedded control focuses the *control* (focus doesn't bubble to the
	 * trigger), so the trigger's focus handler only ever runs for inert
	 * taps — which are exactly the fallback that should open — and for
	 * keyboard focus, which must always open.
	 */
	function touchSuppressesFocus(): boolean {
		if (touchBehavior !== "ignore") return false;
		return Date.now() - touchTapAt <= TOUCH_WINDOW;
	}

	// The content element currently watched for pointer/focus leaving it. It
	// is attached once the pointer or focus enters the content (which cancels
	// the trigger's close timer), so that leaving the content arms a close
	// timer of its own -- otherwise the popout never closes after being
	// entered.
	let watchedContent: HTMLElement | null = null;

	/**
	 * Shows the popout and starts watching its content. Watching from the
	 * moment it opens (rather than only after a trigger-leave close is
	 * canceled) means leaving the content still closes it if the trigger
	 * never received a leave event, e.g. when the content opens under the
	 * pointer.
	 */
	function reveal() {
		show();
		watchContent();
	}

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
			unwatchContent();
			// The content hides with `refocusAnchorOnHide`, which drops focus
			// back onto this trigger; the popout machinery arms the scripted-
			// focus guard before it does, so handleFocus ignores it
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
			watchContent();
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
			watchContent();
		}
	}

	function insideContent(target: EventTarget | null): boolean {
		const content = getContent();
		if (!content || !target) return false;
		return content === target || content.contains(target as Node);
	}

	function watchContent() {
		const content = getContent();
		if (!content || content === watchedContent) return;
		unwatchContent();
		watchedContent = content;
		content.addEventListener("mouseleave", handleContentLeave);
		content.addEventListener("focusout", handleContentFocusOut);
	}

	function unwatchContent() {
		if (watchedContent === null) return;
		watchedContent.removeEventListener("mouseleave", handleContentLeave);
		watchedContent.removeEventListener("focusout", handleContentFocusOut);
		watchedContent = null;
	}

	function handleContentLeave(e: MouseEvent) {
		if (!isVisible()) {
			unwatchContent();
			return;
		}
		if (insideContent(e.relatedTarget)) return;
		scheduleClose();
	}

	function handleContentFocusOut(e: FocusEvent) {
		if (!isVisible()) {
			unwatchContent();
			return;
		}
		if (insideContent(e.relatedTarget)) return;
		scheduleClose();
	}

	return {
		handleEnter() {
			if (disabled()) return false;
			if (touchSuppressesEnter()) {
				// A touch tap on an interactive control (or with "ignore"):
				// the tap runs the control's action; it doesn't request the
				// popout. Don't resume a closing popout or arm the timer
				return false;
			}

			if (closeTimer !== undefined) {
				clearTimeout(closeTimer);
				closeTimer = undefined;
				stopListening();
				unwatchContent();
			}
			if (isVisible()) return true;

			if (hoverDelay <= 0) {
				reveal();
				return true;
			}
			if (openTimer === undefined) {
				openTimer = setTimeout(() => {
					openTimer = undefined;
					reveal();
				}, hoverDelay);
			}
			return true;
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

		handlePointerDown(e: PointerEvent) {
			if (disabled()) return;
			if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

			const target = e.target as Element | null;
			const interactive = target?.closest?.(INTERACTIVE) != null;
			touchTapAt = Date.now();
			touchTapInteractive = interactive;
			if (touchSuppressesEnter()) {
				// A tap that shouldn't reveal the popout must also cancel an
				// open armed by the synthesized mouseenter that precedes it
				cancelPendingOpen();
			}
		},

		handleFocus() {
			if (disabled()) return;

			// The content just hid and refocused this trigger
			// (`refocusAnchorOnHide` + the scripted-focus guard); that
			// refocus is not user intent, so don't re-open
			if (consumeFocusOpenSuppress()) {
				return;
			}

			// A touch tap that shouldn't reveal the popout focuses the
			// trigger too (tapping its inert surface); don't open
			if (touchSuppressesFocus()) {
				return;
			}

			if (closeTimer !== undefined) {
				clearTimeout(closeTimer);
				closeTimer = undefined;
				stopListening();
				unwatchContent();
			}
			if (!isVisible()) {
				reveal();
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
			unwatchContent();
		},
	};
}
