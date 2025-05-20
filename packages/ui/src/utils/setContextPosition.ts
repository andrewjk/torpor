interface Point {
	x: number;
	y: number;
}

export default function setContextPosition(
	anchor: HTMLElement,
	content: HTMLElement,
	position: Point,
): void {
	var anchorRect = anchor.getBoundingClientRect();
	var contentRect = content.getBoundingClientRect();

	content.style.position = "fixed";

	// Try to make sure the content is entirely on the screen horizontally
	// Just move it left or right -- the pointer is outside the content vertically so moving it left
	// or right won't make the content appear over the cursor
	let left = anchorRect.left + position.x;
	left = Math.min(left, window.innerWidth - contentRect.width);
	left = Math.max(left, 0);
	content.style.left = left + "px";

	// Try to make sure the content is entirely on the screen vertically
	// Show it above the position if it wouldn't fit
	let top = anchorRect.top + position.y;
	if (top + contentRect.height > window.innerHeight) {
		top -= contentRect.height;
	}
	content.style.top = top + "px";
}
