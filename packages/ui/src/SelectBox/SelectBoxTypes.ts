import { type FocusApi } from "../utils/PopoutTypes";

export const SelectBoxContextName: unique symbol = Symbol.for("torp.SelectBox");

/** The shared context for modal components (Contextual, Prompt and SelectBox) */
export interface SelectBoxContext extends FocusApi {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	placeholder?: string;
	state: SelectBoxState;
	focusTrigger?: () => void;
	searchText?: string;
	searchItems?: (searchText: string) => { id: string; setFocused: () => void } | undefined;
}

export interface SelectBoxState {
	visible: boolean;
	value: any;
	name?: string;
	contentId?: string;
}
