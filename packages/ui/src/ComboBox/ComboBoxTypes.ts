import { type LoadResult, type Loader } from "../utils/loader";
import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";

export const ComboBoxContextName: unique symbol = Symbol.for("torp.ComboBox");

/** The shared context for ComboBox components */
export interface ComboBoxContext extends PopoutContext {
	placeholder?: string;
	required?: boolean;
	ariaLabel?: string;
	name?: string;
	multiple?: boolean;
	state: ComboBoxState;
	focusInput?: () => void;
	/** Whether the component is contained within a Form Field */
	inField?: () => boolean;
	/** Whether the Field's value is valid, for data-valid / aria-invalid */
	valid?: () => boolean;
	/** The ID of the Field's Message component, for aria-describedby */
	messageId?: () => string | undefined;
	/** Called by the input when it loses focus, to run Field validation */
	handleBlur?: () => void;
	/** Returns the items loaded from the network loader, when one is set */
	getLoadedItems?: () => any[];
	/** Extracts the display text for a loaded item */
	getItemLabel?: (item: any) => any;
	/** Extracts the value for a loaded item */
	getItemValue?: (item: any) => any;
}

export interface ComboBoxState extends PopoutState {
	value: any;
	name?: string;
	activeDescendant?: string;
	/** The current search text, kept up to date by the input when loading */
	searchText?: string;
}

export type { LoadResult, Loader };
