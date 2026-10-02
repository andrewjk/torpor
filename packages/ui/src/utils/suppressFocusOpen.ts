/**
 * One-shot guard for focus events caused by the popout machinery itself.
 *
 * When popout content hides with `refocusAnchorOnHide`, focus drops back
 * onto the anchor -- which may be a component that opens on focus (e.g.
 * PopoverHover, ContextualHover). That scripted refocus is not user intent,
 * so focus-to-open handlers consult `consumeFocusOpenSuppress` to ignore it,
 * instead of arming their own workaround guards.
 */

let armed = false;

/**
 * Arms the guard, so the next focus-to-open check treats the focus as
 * script-driven. Call immediately before a scripted `focus()` call.
 */
export function suppressFocusOpen(): void {
	armed = true;
	// If the scripted refocus never fires (the anchor was already focused,
	// so focus() is a no-op), the guard must not swallow a real user focus
	queueMicrotask(() => {
		armed = false;
	});
}

/** Returns whether the current focus was armed, and disarms it */
export function consumeFocusOpenSuppress(): boolean {
	if (!armed) return false;
	armed = false;
	return true;
}
