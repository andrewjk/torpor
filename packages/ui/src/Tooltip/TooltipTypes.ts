export const TooltipContextName: unique symbol = Symbol.for("torp.Tooltip");

export interface TooltipState {
	/** Whether the tooltip is visible */
	visible: boolean;
	/** The ID of the tooltip content */
	contentId: string | undefined;
	/** The ID of the trigger element */
	triggerId: string | undefined;
}

export interface TooltipContext {
	state: TooltipState;
	/** The element the tooltip is shown next to */
	anchorElement: HTMLElement | undefined;
	/** Whether the trigger ignores hover and focus */
	getDisabled: () => boolean;
	/** Milliseconds to wait before opening */
	getOpenDelay: () => number | undefined;
	/** Milliseconds to wait before closing */
	getCloseDelay: () => number | undefined;
	/** Where the tooltip is shown, relative to the trigger */
	getSide: () => "top" | "right" | "bottom" | "left";
	/** How the tooltip is aligned, relative to the trigger */
	getAlignment: () => "start" | "center" | "end";
	show: () => void;
	hide: () => void;
}
