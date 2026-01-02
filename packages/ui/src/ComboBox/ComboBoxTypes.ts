export const ComboBoxContextName: unique symbol = Symbol.for("torp.ComboBox");

/** The shared context for modal components (Contextual, Prompt and ComboBox) */
export interface ComboBoxContext {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	placeholder?: string;
	state: ComboBoxState;
	focusInput?: () => void;
	focusFirstElement?: () => void;
	focusLastElement?: () => void;
	markElement?: (id: string) => void;
	selectMarkedElement?: () => void;
	searchText?: string;
	searchItems?: (searchText: string) => { id: string } | undefined;
}

export interface ComboBoxState {
	visible: boolean;
	value: any;
	name?: string;
	contentId?: string;
	activeDescendant?: string;
}
