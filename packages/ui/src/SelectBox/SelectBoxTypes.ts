import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";

export const SelectBoxContextName: unique symbol = Symbol.for("torp.SelectBox");

/** The shared context for SelectBox components */
export interface SelectBoxContext extends PopoutContext {
	placeholder?: string;
	state: SelectBoxState;
	focusTrigger?: () => void;
}

export interface SelectBoxState extends PopoutState {
	value: any;
	name?: string;
}
