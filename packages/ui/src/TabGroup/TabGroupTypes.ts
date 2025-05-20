export const TabGroupContextName = "TabGroup";
export const TabItemContextName = "TabItem";

export interface TabGroupContext {
	/** Called from a header when it is added */
	registerHeader: (index: number, value: string, setFocused: () => void) => ItemState;
	/** Called from an item when it is added */
	registerItem: (index: number, value: string) => ItemState;
	/** Called from an item when it is removed */
	removeItem: (index: number) => void;
	/** Called from an item when it is triggered */
	triggerItem: (value: string) => void;
	/** Called from a TabHeader when it receives a keyboard event */
	handleHeaderKey: (index: number, e: KeyboardEvent) => void;
	orientation: "horizontal" | "vertical";
	activation: "automatic" | "manual";
}

export interface TabItemContext {
	/** Called when an item is triggered */
	triggerItem: (value: string) => void;
	/** Called when a TabHeader receives a keyboard event */
	handleHeaderKey: (index: number, e: KeyboardEvent) => void;
	/** The reactive state for an item */
	state: ItemState;
}

export interface ItemState {
	index: number;
	value: string;
	active: boolean;
	headerId: string;
	contentId: string;
	disabled: boolean;
	parentDisabled: boolean;
	dataState: "active" | "inactive";
	/** Called in the TabGroup when a header needs to be focused */
	setFocused: () => void;
}
