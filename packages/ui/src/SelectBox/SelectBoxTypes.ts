export const SelectBoxContextName: unique symbol = Symbol.for("torp.SelectBox");

/** The shared context for modal components (Contextual, Prompt and SelectBox) */
export interface SelectBoxContext {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	// HACK: We need to be able to let children (i.e. Dialogs) override the click outside functionality
	// There may be a more elegant way to accomplish this too
	handleClickOutside?: (e: MouseEvent) => void;
	state: SelectBoxState;
	focusFirstElement?: () => void;
	focusLastElement?: () => void;
}

export interface SelectBoxState {
	visible: boolean;
	value: any;
	contentId?: string;
}
