// Adapted from https://github.com/snabbdom/snabbdom
// With changes from https://github.com/luwes/js-diff-benchmark
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Simon Friis Vindum
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type ListItem from "../types/ListItem";
import type Region from "../types/Region";
import type WatchOptions from "../types/WatchOptions";
import $watch from "../watch/$watch";
import clearRegion from "./clearRegion";
import context from "./context";
import moveRegion from "./moveRegion";
import popRegion from "./popRegion";
import pushRegion from "./pushRegion";

// Hoisted options object — `$watch` only reads `options?.shallow`, so a single
// shared constant can serve every per-item `$watch(data, { shallow: true })`
// call in the create paths below. Removes one object allocation per created
// list item (i.e. one per row in `run`/`add`/`runlots`).
const SHALLOW_WATCH_OPTIONS: WatchOptions = { shallow: true };

/**
 * @param region The list's region
 * @param parent The parent DOM element
 * @param anchor The DOM element to create new items before
 * @param oldItems The list of current items
 * @param newItems The list of future items
 * @param create A function that creates the DOM elements for a new item
 * @param noWatch When true, skip the per-item shallow `$watch` wrap. The
 *   compiler guarantees the `@for` body never writes to its loop variables,
 *   and emits an `update` callback that re-runs item effects manually when a
 *   loop variable's reference actually changes.
 */
export default function runListItems(
	region: Region,
	parent: ParentNode,
	anchor: Node | null,
	oldItems: ListItem[],
	newItems: ListItem[],
	create: (item: ListItem, before: Node | null) => void,
	update: (oldItem: ListItem, newItem: ListItem) => void,
	noWatch?: boolean,
): void {
	let oldStartIndex = 0;
	let oldEndIndex = oldItems.length - 1;
	let oldStartItem = oldItems[0];
	let oldEndItem = oldItems[oldEndIndex];

	let newStartIndex = 0;
	let newEndIndex = newItems.length - 1;
	let newStartItem = newItems[0];
	let newEndItem = newItems[newEndIndex];

	let oldKeyToIndex: Map<any, number> | undefined;
	let newKeyToIndex: Map<any, number> | undefined;

	while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
		if (oldStartItem === null) {
			oldStartItem = oldItems[++oldStartIndex];
		} else if (oldEndItem === null) {
			oldEndItem = oldItems[--oldEndIndex];
		} else if (newStartItem === null) {
			newStartItem = newItems[++newStartIndex];
		} else if (newEndItem === null) {
			newEndItem = newItems[--newEndIndex];
		} else if (oldStartItem.key === newStartItem.key) {
			transferListItemData(oldStartItem, newStartItem, update, noWatch);
			oldStartItem = oldItems[++oldStartIndex];
			newStartItem = newItems[++newStartIndex];
		} else if (oldEndItem.key === newEndItem.key) {
			transferListItemData(oldEndItem, newEndItem, update, noWatch);
			oldEndItem = oldItems[--oldEndIndex];
			newEndItem = newItems[--newEndIndex];
		} else if (oldStartItem.key === newEndItem.key) {
			// Move to the end
			//console.log("move", oldStartItem.key, "to the end");
			moveRegion(parent, oldStartItem, oldEndItem.endNode!.nextSibling!);
			transferListItemData(oldStartItem, newEndItem, update, noWatch);
			oldStartItem = oldItems[++oldStartIndex];
			newEndItem = newItems[--newEndIndex];
		} else if (oldEndItem.key === newStartItem.key) {
			// Move to the start
			//console.log("move", oldEndItem.key, "to the start");
			moveRegion(parent, oldEndItem, oldStartItem!.startNode);
			transferListItemData(oldEndItem, newStartItem, update, noWatch);
			oldEndItem = oldItems[--oldEndIndex];
			newStartItem = newItems[++newStartIndex];
		} else {
			// Lazily build maps of keys to indexes here
			// They are relevant only if there has been a move, or a mid-list
			// insertion or deletion, and not if there has been an insertion
			// at the end or deletion from the front
			if (oldKeyToIndex === undefined || newKeyToIndex === undefined) {
				oldKeyToIndex = new Map();
				for (let i = oldStartIndex; i <= oldEndIndex; i++) {
					oldKeyToIndex.set(oldItems[i]!.key, i);
				}
				newKeyToIndex = new Map();
				let anyOverlap = false;
				for (let i = newStartIndex; i <= newEndIndex; i++) {
					const key = newItems[i]!.key;
					newKeyToIndex.set(key, i);
					if (!anyOverlap && oldKeyToIndex.has(key)) {
						anyOverlap = true;
					}
				}

				// Fast path: no keys overlap between the remaining old and new
				// ranges. Every old item must be cleared and every new item
				// created. Batch the clears (reverse order so each region's
				// DOM nodes are still attached when clearRegion walks them —
				// clearing forwards detaches the next item's startNode) and
				// the creates (tight loop, no per-item region-chain rewiring
				// like the Replace branch's savedPrevious save/restore) instead
				// of interleaving them through the while loop. Helps the
				// common "replace all" / "rebuild from scratch" case where
				// every key is new (e.g. `run`, `replace` in js-framework-bench).
				if (!anyOverlap) {
					const lastOld = oldItems[oldEndIndex];
					let before: Node | null = lastOld?.endNode?.nextSibling ?? anchor;

					for (let i = oldEndIndex; i >= oldStartIndex; i--) {
						const old = oldItems[i];
						if (old !== null) {
							clearRegion(old);
						}
					}

				for (let i = newStartIndex; i <= newEndIndex; i++) {
					const newItem = newItems[i]!;
					const pushedRegion = pushRegion(newItem, true);
					if (noWatch !== true) {
						newItem.data = $watch(newItem.data, SHALLOW_WATCH_OPTIONS);
					}
					create(newItem, before);
					popRegion(pushedRegion);
					before = newItem.endNode!.nextSibling;
				}

					if (newItems.length > 0) {
						region.nextRegion = newItems[0]!;
					} else if (oldItems.length > 0) {
						region.nextRegion = oldItems[oldItems.length - 1]!.nextRegion;
					}
					return;
				}
			}

			let oldIndex = oldKeyToIndex.get(newStartItem.key);
			let newIndex = newKeyToIndex.get(oldStartItem.key);

			if (oldIndex === undefined && newIndex === undefined) {
				// Replace
				//console.log("replace", oldStartItem.key, "with", newStartItem.key);
				const savedPrevious = context.previousRegion;
				const oldRegion = pushRegion(newStartItem, true);
				if (noWatch !== true) {
					newStartItem.data = $watch(newStartItem.data, SHALLOW_WATCH_OPTIONS);
				}
				create(newStartItem, oldStartItem.startNode);
				popRegion(oldRegion);
				context.previousRegion = savedPrevious;
				newStartItem.previousRegion = oldStartItem.previousRegion;
				newStartItem.nextRegion = oldStartItem;
				oldStartItem.previousRegion = newStartItem;
				clearRegion(oldStartItem);
				oldStartItem = oldItems[++oldStartIndex];
				newStartItem = newItems[++newStartIndex];
			} else if (oldIndex === undefined) {
				// Insert
				//console.log("insert", newStartItem.key);
				const oldRegion = pushRegion(newStartItem, true);
				if (noWatch !== true) {
					newStartItem.data = $watch(newStartItem.data, SHALLOW_WATCH_OPTIONS);
				}
				create(newStartItem, oldStartItem.startNode);
				popRegion(oldRegion);
				newStartItem = newItems[++newStartIndex];
			} else if (newIndex === undefined) {
				// Delete
				//console.log("delete", oldStartItem.key);
				clearRegion(oldStartItem);
				oldStartItem = oldItems[++oldStartIndex];
			} else {
				// Move
				//console.log("move", newStartItem.key, "before", oldStartItem.key);
			const oldData = oldItems[oldIndex];
			moveRegion(parent, oldData, oldStartItem.startNode);
			transferListItemData(oldData, newStartItem, update, noWatch);
				// @ts-ignore TODO: Set key null instead?
				oldItems[oldIndex] = null;
				newStartItem = newItems[++newStartIndex];
			}
		}
	}

	if (oldStartIndex <= oldEndIndex || newStartIndex <= newEndIndex) {
		if (oldStartIndex > oldEndIndex) {
			// The old list is exhausted; process new list additions
			// HACK: I think it would be better to move anchors to the end?
			let before =
				oldStartItem?.startNode ?? oldItems[oldItems.length - 1]?.endNode?.nextSibling ?? anchor;
			for (newStartIndex; newStartIndex <= newEndIndex; newStartItem = newItems[++newStartIndex]) {
				//console.log("create", newStartItem.key);
				const oldRegion = pushRegion(newStartItem, true);
				if (noWatch !== true) {
					newStartItem.data = $watch(newStartItem.data, SHALLOW_WATCH_OPTIONS);
				}
				create(newStartItem, before);
				popRegion(oldRegion);
				before = newStartItem.endNode!.nextSibling;
			}
		} else {
			// The new list is exhausted; process old list removals
			for (oldEndIndex; oldEndIndex >= oldStartIndex; oldStartItem = oldItems[oldEndIndex--]) {
				//console.log("clear", oldStartItem.key);
				clearRegion(oldStartItem);
			}
		}
	}

	if (newItems.length > 0) {
		region.nextRegion = newItems[0];
	} else if (oldItems.length > 0) {
		region.nextRegion = oldItems[oldItems.length - 1].nextRegion;
	}
}

function transferListItemData(
	oldItem: ListItem,
	newItem: ListItem,
	update: (oldItem: ListItem, newItem: ListItem) => void,
	noWatch?: boolean,
) {
	newItem.startNode = oldItem.startNode;
	newItem.endNode = oldItem.endNode;
	newItem.depth = oldItem.depth;

	// Manually transfer the new data's props to the old ones (to run effects)
	// and then set the new data to the old one
	update(oldItem, newItem);
	newItem.data = oldItem.data;

	// In no-proxy mode, the compiler-emitted `updateListItem` re-runs item
	// effects directly via `t_rerun_region_effects(oldItem)` instead of
	// relying on Proxy signal propagation. For that to keep working on
	// subsequent reconciliations, the effects must live on whichever item is
	// currently in `listItems` (otherwise they get stranded on an orphaned
	// original item and future updates never see them). Move them now, while
	// both references are still handy. In proxy mode this is a no-op for
	// correctness — the signal's `firstTarget` chain owns the live
	// subscription regardless of which `.effects` array indexes it — but we
	// restrict it to no-proxy mode to avoid any behavioural surprise.
	if (noWatch === true && oldItem.effects.length > 0) {
		for (let effect of oldItem.effects) {
			newItem.effects.push(effect);
		}
		oldItem.effects.length = 0;
	}

	// HACK: This is just for dev tools, so we have the right `name [id]`
	newItem.name = oldItem.name;
}
