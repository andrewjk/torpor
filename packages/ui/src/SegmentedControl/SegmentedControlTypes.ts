export const SegmentedControlContextName: unique symbol = Symbol.for("torp.SegmentedControl");

export interface SegmentedControlContext {
	/** Called from an item when it is added */
	registerItem: (
		index: number | undefined,
		value: string | undefined,
		disabled: boolean | undefined,
	) => ItemState;
	/** Called from an item when it is removed */
	removeItem: (index: number) => void;
	/** Called from an item when it is selected */
	triggerItem: (value: string) => void;
	/** Called from an item when it receives a keyboard event */
	handleItemKey: (index: number, e: KeyboardEvent) => void;
}

export interface ItemState {
	index: number;
	value: string;
	active: boolean;
	disabled: boolean;
	parentDisabled: boolean;
	/** Called in the SegmentedControl when an item needs to be focused */
	setFocused: () => void;
}
