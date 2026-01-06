export const TreeContextName: unique symbol = Symbol.for("torp.Tree");

export interface TreeContext {
	type: "single" | "multiple";
	state: TreeState;
	registerItem: (state: ItemState, level: number) => void;
	removeItem: (index: number) => void;
	toggleExpand: (value: string) => void;
	toggleSelect: (value: string) => void;
	handleKey: (index: number, e: KeyboardEvent) => void;
	focusFirstItem: () => void;
	focusLastItem: () => void;
	findItem: (index: number) => ItemState | undefined;
	getNextVisibleItem: (index: number) => ItemState | undefined;
	getPreviousVisibleItem: (index: number) => ItemState | undefined;
	getParentItem: (index: number) => ItemState | undefined;
	getFirstChildItem: (index: number) => ItemState | undefined;
}

export const TreeItemContextName: unique symbol = Symbol.for("torp.TreeItem");

export interface TreeItemContext {
	state: ItemState;
	setHasChildren: (hasChildren: boolean) => void;
}

export interface TreeState {
	expanded?: string | string[];
	value?: string | string[];
}

export interface ItemState {
	id: string;
	index: number;
	value: string;
	expanded: boolean;
	selected: boolean;
	disabled: boolean;
	parentDisabled: boolean;
	level: number;
	hasChildren: boolean;
	setFocused: () => void;
}
