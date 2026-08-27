export const FocusGroupContextName: unique symbol = Symbol.for("torp.FocusGroupItem");

export interface FocusGroupItemState {
	index?: number;
	setFocused: () => void;
	disabled?: boolean;
}

export interface FocusGroupContext {
	registerItem: (item: FocusGroupItemState) => { index: number };
	removeItem: (index: number) => void;
	handleItemFocus: (index: number) => void;
	handleItemKey: (e: KeyboardEvent) => void;
	/** Which item index currently holds (or would receive) the tab stop */
	tabStopIndex: () => number;
}
