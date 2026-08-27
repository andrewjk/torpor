import { $watch } from "@torpor/view";
import { focusItem, type FocusTarget } from "./focusItem";

/**
 * A managed collection of focusable items with roving tabindex semantics,
 * for group-style components where tabbing into the group lands on one item
 * (the tab stop) and arrow keys move focus within it (ToolBar, MenuBar,
 * button groups, Rating, SegmentedControl...).
 *
 * Owns the registration ledger (indexed states, ordered add/remove) that
 * every list-like component duplicates today, plus the focus bookkeeping:
 * `focusIndex` tracking via onItemFocus, first-item focus when the group
 * itself takes focus, and keyboard movement over enabled items through
 * utils/focusItem.
 *
 * Items are plain states carrying an index, a setFocused implementation and
 * a disabled flag; each component renders its own elements and wires
 * onfocus/onkeydown to the returned handlers.
 */
export interface FocusItemState {
	/** Assigned by the group in registration order */
	index?: number;
	/** Focuses this item's element; implemented by the component's item */
	setFocused: () => void;
	/** Disabled items are skipped by movement */
	disabled?: boolean;
}

export interface FocusGroup<T extends FocusItemState> {
	/** The registered item states, in order */
	itemStates: T[];

	/** Adds an item state, assigning its index from position; returns it */
	registerItem: (item: T) => { index: number };

	/** Removes an item by index, reindexing the rest */
	removeItem: (itemIndex: number) => void;

	/**
	 * Item onfocus handler: records the current tab stop
	 */
	handleItemFocus: (index: number) => void;

	/**
	 * Group-level key handler for a directional press at `index`. Handles
	 * left/right (+up/down when vertical), Home and End; arrow keys depend
	 * on orientation, matching ToolBar behavior.
	 */
	handleGroupKey: (
		index: number,
		e: KeyboardEvent,
		options?: { vertical?: boolean },
	) => boolean;

	/** Moves focus from `index` to the target item (disabled items skipped) */
	moveFocus: (index: number, target: FocusTarget) => void;

	/** Focuses the first / last enabled item (popout open behavior) */
	focusFirstItem: () => void;
	focusLastItem: () => void;

	/**
	 * Whether any item is the current tab stop; components derive their
	 * per-item tabindex from this plus the tracked focus index
	 */
	getFocusIndex: () => number;

	/**
	 * Whether item `index` should be the group's single tab stop: when focus
	 * hasn't entered the group yet that is item 0, otherwise whichever item
	 * focus last rested on.
	 */
	isTabStop: (index: number) => boolean;
}

export function createFocusGroup<T extends FocusItemState>(): FocusGroup<T> {
	const itemStates: T[] = [];
	// The tracked index is reactive, so components can derive each item's
	// roving tabindex from it in their templates
	const $state = $watch({ index: -1 });

	function registerItem(item: T): { index: number } {
		item.index = itemStates.length;
		itemStates.push(item);
		return { index: item.index };
	}

	function removeItem(itemIndex: number) {
		const i = itemStates.findIndex((item) => item.index === itemIndex);
		if (i !== -1) {
			itemStates.splice(i, 1);
			// Reindex the tail so indices stay dense
			for (let j = i; j < itemStates.length; j++) {
				itemStates[j].index = j;
			}
			if ($state.index > i) {
				$state.index--;
			} else if ($state.index === i) {
				$state.index = -1;
			}
		}
	}

	function handleItemFocus(index: number) {
		$state.index = index;
	}

	function getFocusIndex(): number {
		return $state.index;
	}

	function isTabStop(index: number): boolean {
		return ($state.index === -1 ? 0 : $state.index) === index;
	}

	function moveFocus(index: number, target: FocusTarget) {
		if (itemStates.length === 0) return;
		$state.index = focusItem(itemStates, index === -1 ? 0 : index, target);
	}

	function focusFirstItem() {
		if (itemStates.length) {
			$state.index = 0;
			itemStates[0].setFocused();
		}
	}

	function focusLastItem() {
		if (itemStates.length > 0) {
			$state.index = itemStates.length - 1;
			itemStates.at(-1)!.setFocused();
		}
	}

	function handleGroupKey(
		index: number,
		e: KeyboardEvent,
		options?: { vertical?: boolean },
	): boolean {
		const vertical = options?.vertical ?? false;
		let handled = true;
		switch (e.key) {
			case "ArrowRight": {
				if (!vertical) {
					e.preventDefault();
					moveFocus(index, "next");
				} else {
					handled = false;
				}
				break;
			}
			case "ArrowLeft": {
				if (!vertical) {
					e.preventDefault();
					moveFocus(index, "previous");
				} else {
					handled = false;
				}
				break;
			}
			case "ArrowDown": {
				if (vertical) {
					e.preventDefault();
					moveFocus(index, "next");
				} else {
					handled = false;
				}
				break;
			}
			case "ArrowUp": {
				if (vertical) {
					e.preventDefault();
					moveFocus(index, "previous");
				} else {
					handled = false;
				}
				break;
			}
			case "Home": {
				e.preventDefault();
				moveFocus(index, "start");
				break;
			}
			case "End": {
				e.preventDefault();
				moveFocus(index, "end");
				break;
			}
			default: {
				handled = false;
			}
		}
		return handled;
	}

	return {
		itemStates,
		registerItem,
		removeItem,
		handleItemFocus,
		handleGroupKey,
		moveFocus,
		focusFirstItem,
		focusLastItem,
		getFocusIndex,
		isTabStop,
	};
}
