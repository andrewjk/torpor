export const TabGroupContextName = "TabGroup";
export const TabItemContextName = "TabItem";

export interface TabGroupContext {
	/** Called from a header when it is added */
	registerHeader: (
		index: number | undefined,
		value: string | undefined,
		setFocused: () => void,
	) => ItemState;
	/** Called from an item when it is added */
	registerItem: (index: number | undefined, value: string | undefined) => ItemState;
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
	/** Raised when an item is triggered */
	triggerItem: (value: string) => void;
	/** Raised when a TabHeader receives a keyboard event */
	handleHeaderKey: (index: number, e: KeyboardEvent) => void;
	/** The reactive state for an item */
	state: ItemState;
	orientation: "horizontal" | "vertical";
	activation: "automatic" | "manual";
}

export interface ItemState {
	index: number;
	value: string;
	active: boolean;
	headerId: string;
	contentId: string;
	disabled: boolean;
	parentDisabled: boolean;
	/** Called in the TabGroup when a header needs to be focused */
	setFocused: () => void;
}
