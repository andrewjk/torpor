export function disableScroll(): () => void {
	// Remember body styles
	const overflowX = document.body.style.overflowY;
	const overflowY = document.body.style.overflowY;
	const overscrollBehaviourX = document.body.style.overscrollBehaviorX;
	const overscrollBehaviourY = document.body.style.overscrollBehaviorY;
	const marginRight = document.body.style.marginRight;

	// Get scrollbar width (if visible) so that we can set a margin to avoid things jumping around
	// HACK: Does this work in all browsers/systems?
	const scrollBarWidth = window.innerWidth - document.body.clientWidth;

	// Set body styles to disallow scrolling
	document.body.style.overflowY = "hidden";
	document.body.style.overflowY = "hidden";
	document.body.style.overscrollBehaviorX = "contain";
	document.body.style.overscrollBehaviorY = "contain";
	document.body.style.marginRight = scrollBarWidth + "px";

	return () => {
		// Reset body styles
		document.body.style.overflowY = overflowX;
		document.body.style.overflowY = overflowY;
		document.body.style.overscrollBehaviorX = overscrollBehaviourX;
		document.body.style.overscrollBehaviorY = overscrollBehaviourY;
		document.body.style.marginRight = marginRight;
	};
}
