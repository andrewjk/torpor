import type { LoadRequest, Loader } from "../utils/loader";
import type { LoadResult } from "../utils/loader";

/** The shape of a request sent to a Tree's `load` function */
export interface TreeLoadRequest extends LoadRequest {
	/** The value of the item whose children to load */
	item?: string;
}

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
	/**
	 * Reads the children of an item that declares `hasChildren`, called when
	 * the item is first expanded
	 */
	load: Loader<any, TreeLoadRequest> | undefined;
	/** Called after each successful child load with the normalized result */
	onload: ((result: LoadResult, item: string | undefined) => void) | undefined;
	/** Extracts the display text for a loaded item (defaults to `label ?? text ?? item`) */
	getItemLabel: ((item: any) => any) | undefined;
	/** Extracts the value for a loaded item (defaults to `value ?? id`) */
	getItemValue: ((item: any) => any) | undefined;
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
