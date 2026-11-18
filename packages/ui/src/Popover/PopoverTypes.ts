import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";

export const PopoverContextName: unique symbol = Symbol.for("torp.Popover");

/** The shared context for popover components (Contextual, Prompt and Popover) */
export interface PopoverContext extends PopoutContext {
	state: PopoverState;
	/** Whether the popover is positioned at an explicit point */
	isContextual: () => boolean;
}

export interface PopoverState extends PopoutState {
	position: Point;
}

export interface Point {
	x: number;
	y: number;
}
