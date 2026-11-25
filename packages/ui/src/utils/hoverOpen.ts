/**
 * Shared hover-to-open behavior for popout triggers: opens after a delay,
 * resetting the timer as the user moves within the element.
 */
export function createHoverOpen(
	open: () => void,
	disabled: () => boolean,
	delay: number,
): {
	handleMouseEnter: () => void;
	handleMouseLeave: () => void;
	handleMouseMove: () => void;
	cancel: () => void;
} {
	let interval: ReturnType<typeof setTimeout> | undefined;

	function schedule() {
		interval = setTimeout(() => {
			interval = undefined;
			open();
		}, delay);
	}

	function cancel() {
		if (interval) {
			clearTimeout(interval);
			interval = undefined;
		}
	}

	function handleMouseEnter() {
		if (disabled()) return;

		// Handle the hover after a delay
		if (!interval) {
			schedule();
		}
	}

	function handleMouseLeave() {
		if (disabled()) return;

		// Prevent short hovers or touches from firing the event
		cancel();
	}

	function handleMouseMove() {
		if (disabled()) return;

		// Reset the interval on mouse move
		if (interval) {
			clearTimeout(interval);
			schedule();
		}
	}

	return { handleMouseEnter, handleMouseLeave, handleMouseMove, cancel };
}
