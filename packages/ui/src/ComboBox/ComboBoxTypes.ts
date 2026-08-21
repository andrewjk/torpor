import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";

export const ComboBoxContextName: unique symbol = Symbol.for("torp.ComboBox");

/** The shared context for ComboBox components */
export interface ComboBoxContext extends PopoutContext {
	placeholder?: string;
	required?: boolean;
	ariaLabel?: string;
	name?: string;
	state: ComboBoxState;
	focusInput?: () => void;
}

export interface ComboBoxState extends PopoutState {
	value: any;
	name?: string;
	activeDescendant?: string;
}
