export default function setPopoverPosition(
	anchor: HTMLElement,
	content: HTMLElement,
	side: "top" | "right" | "bottom" | "left",
	alignment: "start" | "center" | "end",
): void {
	var anchorRect = anchor.getBoundingClientRect();
	var contentRect = content.getBoundingClientRect();

	content.style.position = "fixed";

	// Check that we there is enough room to show the content on the side requested
	// Otherwise, if there is enough room on the other side, show it there instead
	let calculatedSide = side;
	const canShowOnTop = anchorRect.top - contentRect.height >= 0;
	const canShowAtRight = anchorRect.right + contentRect.width <= window.innerWidth;
	const canShowOnBottom = anchorRect.bottom + contentRect.height <= window.innerHeight;
	const canShowAtLeft = anchorRect.left - contentRect.width >= 0;
	switch (side) {
		case "top": {
			if (!canShowOnTop && canShowOnBottom) {
				calculatedSide = "bottom";
			}
			break;
		}
		case "right": {
			if (!canShowAtRight && canShowAtLeft) {
				calculatedSide = "left";
			}
			break;
		}
		case "bottom": {
			if (!canShowOnBottom && canShowOnTop) {
				calculatedSide = "top";
			}
			break;
		}
		case "left": {
			if (!canShowAtLeft && canShowAtRight) {
				calculatedSide = "right";
			}
			break;
		}
		default: {
			throw new Error(`Invalid MenuPopout side: ${side}`);
		}
	}

	switch (calculatedSide) {
		case "top": {
			content.style.top = anchorRect.top - contentRect.height + "px";
			setVerticalAlignment(content, anchorRect, contentRect, alignment);
			break;
		}
		case "right": {
			content.style.left = anchorRect.right + "px";
			setHorizontalAlignment(content, anchorRect, contentRect, alignment);
			break;
		}
		case "bottom": {
			content.style.top = anchorRect.bottom + "px";
			setVerticalAlignment(content, anchorRect, contentRect, alignment);
			break;
		}
		case "left": {
			content.style.left = anchorRect.left - contentRect.width + "px";
			setHorizontalAlignment(content, anchorRect, contentRect, alignment);
			break;
		}
		default: {
			throw new Error(`Invalid MenuPopout side: ${side}`);
		}
	}
}

function setVerticalAlignment(
	content: HTMLElement,
	anchorRect: DOMRect,
	contentRect: DOMRect,
	alignment: "start" | "center" | "end",
) {
	let left = 0;
	switch (alignment) {
		case "start": {
			left = anchorRect.left;
			break;
		}
		case "center": {
			left = anchorRect.left + anchorRect.width / 2 - contentRect.width / 2;
			break;
		}
		case "end": {
			left = anchorRect.right - contentRect.width;
			break;
		}
		default: {
			throw new Error(`Invalid Popout alignment: ${alignment}`);
		}
	}

	// Try to make sure the content is entirely on the screen horizontally
	left = Math.min(left, window.innerWidth - contentRect.width);
	left = Math.max(left, 0);

	content.style.left = left + "px";
}

function setHorizontalAlignment(
	content: HTMLElement,
	anchorRect: DOMRect,
	contentRect: DOMRect,
	alignment: "start" | "center" | "end",
) {
	let top = 0;
	switch (alignment) {
		case "start": {
			top = anchorRect.top;
			break;
		}
		case "center": {
			top = anchorRect.top + anchorRect.height / 2 - contentRect.height / 2;
			break;
		}
		case "end": {
			top = anchorRect.bottom - contentRect.height;
			break;
		}
		default: {
			throw new Error(`Invalid Popout alignment: ${alignment}`);
		}
	}

	// Try to make sure the content is entirely on the screen vertically
	top = Math.min(top, window.innerHeight - contentRect.height);
	top = Math.max(top, 0);

	content.style.top = top + "px";
}
