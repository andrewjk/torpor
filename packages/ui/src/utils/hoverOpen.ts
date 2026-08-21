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
} {
	let interval: ReturnType<typeof setTimeout> | undefined;

	function schedule() {
		interval = setTimeout(() => open(), delay);
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
		if (interval) {
			clearTimeout(interval);
			interval = undefined;
		}
	}

	function handleMouseMove() {
		if (disabled()) return;

		// Reset the interval on mouse move
		if (interval) {
			clearTimeout(interval);
			schedule();
		}
	}

	return { handleMouseEnter, handleMouseLeave, handleMouseMove };
}
