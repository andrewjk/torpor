export const ListBoxContextName: unique symbol = Symbol.for("torp.ListBox");
export const ListBoxItemContextName: unique symbol = Symbol.for("torp.ListBoxItem");

export interface ListBoxContext {
	type: "single" | "multiple";
	state: ListBoxState;
	/** Called from a ListBoxItem when it is added */
	registerItem: (state: ItemState) => void;
	/** Called from a ListBoxItem when it is removed */
	removeItem: (index: number) => void;
	/** Called from a ListBoxItem when it is toggled */
	toggleItem: (value: string) => void;
	/** Called from a ListBoxItem when it receives a keyboard event */
	handleKey: (index: number, e: KeyboardEvent) => void;
	/** Called from a ListBoxItem when it receives focus */
	setActiveDescendant?: (id: string) => void;
	/** Reads the items loaded from the network loader, when one is set */
	getLoadedItems?: () => any[];
	/** Extracts the display text for a loaded item */
	getItemLabel?: (item: any) => any;
	/** Extracts the value for a loaded item */
	getItemValue?: (item: any) => any;
}

export interface ListBoxState {
	value: any;
}

export interface ItemState {
	id: string;
	index: number;
	text: string;
	value: any;
	selected: boolean;
	/** Used for styling when item has keyboard focus */
	active: boolean;
	disabled: boolean;
	parentDisabled: boolean;
	/** Called in the ListBox when an item needs to be focused */
	setFocused: () => void;
}
