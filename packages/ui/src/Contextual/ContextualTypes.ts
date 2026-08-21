import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";

export const ContextualContextName: unique symbol = Symbol.for("torp.Contextual");

/** The shared context for popover components (Contextual, Prompt and Contextual) */
export interface ContextualContext extends PopoutContext {
	state: ContextualState;
}

export interface ContextualState extends PopoutState {
	position: Point;
}

export interface Point {
	x: number;
	y: number;
}
