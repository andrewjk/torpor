import { type PopoutContext, type PopoutState } from "../utils/PopoutTypes";
import { type LoadResult, type Loader } from "../utils/loader";

export const SelectBoxContextName: unique symbol = Symbol.for("torp.SelectBox");

/** The shared context for SelectBox components */
export interface SelectBoxContext extends PopoutContext {
	placeholder?: string;
	multiple?: boolean;
	state: SelectBoxState;
	focusTrigger?: () => void;
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
