import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";
import { type LoadResult, type Loader } from "../utils/loader";

export const SelectBoxContextName: unique symbol = Symbol.for("torp.SelectBox");

/** The shared context for SelectBox components */
export interface SelectBoxContext extends PopoutContext {
	placeholder?: string;
	multiple?: boolean;
	state: SelectBoxState;
	focusTrigger?: () => void;
	/** Whether the component is contained within a Form Field */
	inField?: () => boolean;
	/** Whether the Field's value is valid, for data-valid / aria-invalid */
	valid?: () => boolean;
	/** The ID of the Field's Message component, for aria-describedby */
	messageId?: () => string | undefined;
	/** Called by the trigger when it loses focus, to run Field validation */
	handleBlur?: () => void;
	/** Returns the items loaded from the network loader, when one is set */
	getLoadedItems?: () => any[];
	/** Extracts the display text for a loaded item */
	getItemLabel?: (item: any) => any;
	/** Extracts the value for a loaded item */
	getItemValue?: (item: any) => any;
}

export interface SelectBoxState extends PopoutState {
	value: any;
	name?: string;
}

export type { LoadResult, Loader };
