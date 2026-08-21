import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";

export const PopoverContextName: unique symbol = Symbol.for("torp.Popover");

/** The shared context for popover components (Contextual, Prompt and Popover) */
export interface PopoverContext extends PopoutContext {
	state: PopoverState;
}

export interface PopoverState extends PopoutState {
	position: Point;
}

export interface Point {
	x: number;
	y: number;
}
