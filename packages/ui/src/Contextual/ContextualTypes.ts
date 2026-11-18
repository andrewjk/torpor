import type { PopoverContext, PopoverState } from "../Popover/PopoverTypes";

/** @deprecated Contextual uses Popover's context */
export const ContextualContextName: unique symbol = Symbol.for("torp.Contextual");

/** The shared context for Contextual components */
export type ContextualContext = PopoverContext;

export type ContextualState = PopoverState;

export type { Point } from "../Popover/PopoverTypes";
