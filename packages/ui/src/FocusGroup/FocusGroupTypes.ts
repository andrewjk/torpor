import type { FocusItemState } from "../utils/focusGroup";

export const FocusGroupContextName: unique symbol = Symbol.for("torp.FocusGroupItem");

export type { FocusItemState };

export interface FocusGroupContext {
	registerItem: (item: FocusItemState) => { index: number };
	removeItem: (index: number) => void;
	handleItemFocus: (index: number) => void;
	handleItemKey: (e: KeyboardEvent) => void;
	/** Whether item `index` is currently the group's single tab stop */
	isTabStop: (index: number) => boolean;
}
