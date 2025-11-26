export const ListBoxContextName: unique symbol = Symbol.for("torp.ListBox");
export const ListBoxItemContextName: unique symbol = Symbol.for("torp.ListBoxItem");

export interface ListBoxContext {
	/** Called from an ListBoxItem when it is added */
	registerItem: (state: ItemState, setFocused: () => void) => void;
	/** Called from an ListBoxItem when it is removed */
	removeItem: (index: number) => void;
	/** Called from an ListBoxItem when it is toggled */
	toggleItem: (value: string) => void;
	/** Called from an ListBoxItem when it receives a keyboard event */
	handleKey: (index: number, e: KeyboardEvent) => void;
}

export interface ItemState {
	index: number;
	value: any;
	selected: boolean;
	headerId: string;
	contentId: string;
	disabled: boolean;
	parentDisabled: boolean;
	/** Called in the ListBox when an item needs to be focused */
	setFocused: () => void;
}
