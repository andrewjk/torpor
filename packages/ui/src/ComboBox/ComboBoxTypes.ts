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
