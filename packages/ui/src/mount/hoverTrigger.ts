interface HoverTriggerOptions {
	onHover: (node: HTMLElement, e: TouchEvent | MouseEvent) => void;
	onExit?: (node: HTMLElement, e: TouchEvent | MouseEvent) => void;
	hoverDelay?: number;
	touchDelay?: number;
}

export default function hoverTrigger(node: HTMLElement, options: HoverTriggerOptions): () => void {
	const { onHover, onExit } = options;
	const hoverDelay = options.hoverDelay || 1000;
	const touchDelay = options.touchDelay || 1000;

	let interval: NodeJS.Timeout | undefined;

	// Add click event handlers to the node
	node.addEventListener("mouseenter", handleMouseEnter);
	node.addEventListener("mouseleave", handleMouseLeave);
	node.addEventListener("mousemove", handleMouseMove);
	node.addEventListener("touchstart", handleMouseEnter);
	node.addEventListener("touchend", handleMouseLeave);

	function handleMouseEnter(e: MouseEvent | TouchEvent) {
		// Handle the hover after a delay
		e.preventDefault();
		if (!interval) {
			const delay = e.type.startsWith("mouse") ? hoverDelay : touchDelay;
			interval = setTimeout(() => onHover(node, e), delay);
		}
	}

	function handleMouseLeave(e: MouseEvent | TouchEvent) {
		// Prevent short hovers or touches from firing the event
		if (interval) {
			clearTimeout(interval);
			interval = undefined;
		}

		if (onExit) {
			onExit(node, e);
		}
	}

	function handleMouseMove(e: MouseEvent) {
		// Reset the interval on mouse move
		if (interval) {
			clearTimeout(interval);
			interval = setTimeout(() => onHover(node, e), hoverDelay);
		}
	}

	// Remove the event listeners from the node on destroy
	return () => {
		node.removeEventListener("mouseenter", handleMouseEnter);
		node.removeEventListener("mouseleave", handleMouseLeave);
		node.removeEventListener("mousemove", handleMouseMove);
		node.removeEventListener("touchstart", handleMouseEnter);
		node.removeEventListener("touchend", handleMouseLeave);
	};
}
