export const SortableListContextName: unique symbol = Symbol("SortableList");

export interface SortableListContext {
	/** A unique kind for this list's drags, so they don't cross lists */
	kind: string;
	/** The items, in display order */
	getItems: () => any[];
	/** The accessible text for an item */
	getItemLabel: (item: any) => string;
	/** Whether the list is disabled */
	getDisabled: () => boolean;
	/** Moves the item at `from` to `insertAt` (an index in the original order) */
	move: (from: number, insertAt: number) => void;
	/** Announces a reorder to assistive tech */
	announce: (message: string) => void;
}
