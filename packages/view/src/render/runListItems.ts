// Keyed list reconciliation. Replaces the original snabbdom-derived 4-way
// head/tail heuristic with a prefix/suffix sync + longest-increasing-
// subsequence (LIS) pass, which produces the *minimal* move set. The snabbdom
// greedy Move branch did ~(N−k) DOM moves for a `displace_k` (shift first k to
// end); LIS does exactly k. Operations (`moveRegion` / `create` / `clearRegion`
// / `transferListItemData`) and the region-chain invariants are unchanged —
// only the scheduling of which items to move/mount/clear/patch is smarter.
//
// The sibling region chain (`previousRegion`/`nextRegion`) is pre-linked by the
// compiler-emitted `buildItems` callback in new-array order, so `runListItems`
// never needs to relink it. Mounts in the LIS pass run right-to-left (for
// anchor correctness — each item's right neighbour has already been placed),
// which means we can't use `pushRegion(item, true)` there (it re-links the
// chain based on `context.previousRegion` and would reverse it). `mountItem`
// below establishes just the active region + depth that `create()` needs for
// effect/event attachment, leaving the chain untouched.
import type ListItem from "../types/ListItem";
import type Region from "../types/Region";
import type WatchOptions from "../types/WatchOptions";
import $watch from "../watch/$watch";
import clearRegion from "./clearRegion";
import context from "./context";
import getSequence from "./getSequence";
import moveRegion from "./moveRegion";

// Hoisted options object — `$watch` only reads `options?.shallow`, so a single
// shared constant can serve every per-item `$watch(data, { shallow: true })`
// call in the create paths below. Removes one object allocation per created
// list item (i.e. one per row in `run`/`add`/`runlots`).
const SHALLOW_WATCH_OPTIONS: WatchOptions = { shallow: true };

/**
 * Mounts a new list item: establishes it as the active region (so the
 * compiler-emitted `create` callback attaches effects/events to the right
 * region), sets its depth, optionally wraps its data in a shallow watch, then
 * runs `create`. The sibling chain is left as `buildItems` linked it.
 */
function mountItem(
	newItem: ListItem,
	region: Region,
	before: Node | null,
	create: (item: ListItem, before: Node | null) => void,
	noWatch?: boolean,
): void {
	const savedActiveRegion = context.activeRegion;
	newItem.depth = region.depth + 1;
	context.activeRegion = newItem;
	if (noWatch !== true) {
		newItem.data = $watch(newItem.data, SHALLOW_WATCH_OPTIONS);
	}
	create(newItem, before);
	context.activeRegion = savedActiveRegion;
}

/**
 * Reconciles an old keyed list against a new keyed list, producing the minimal
 * set of DOM moves / mounts / clears / patches.
 *
 * @param region The list's region
 * @param parent The parent DOM element
 * @param anchor The DOM node to create new items before (the list's trailing anchor)
 * @param oldItems The list of current items
 * @param newItems The list of future items
 * @param create A function that creates the DOM elements for a new item
 * @param update A function that syncs a matched item's data (re-runs effects if changed)
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
	let oldStart = 0;
	let oldEnd = oldItems.length - 1;
	let newStart = 0;
	let newEnd = newItems.length - 1;

	// 1. Fast path: peel off matching heads/tails and boundary rotations
	//    (head→tail / tail→head) one item at a time, without building a
	//    keymap. This handles append / prepend / swap / rotate and the
	//    common-prefix/suffix portions of any change in O(1) per item.
	//    rotateb/rotatef land here entirely (no keymap, no LIS). When no
	//    boundary key matches, break and fall through to the LIS pass for
	//    the messy middle (displace/shuffle).
	while (oldStart <= oldEnd && newStart <= newEnd) {
		if (oldItems[oldStart]!.key === newItems[newStart]!.key) {
			// common head — patch in place
			transferListItemData(oldItems[oldStart]!, newItems[newStart]!, update, noWatch);
			oldStart++;
			newStart++;
		} else if (oldItems[oldEnd]!.key === newItems[newEnd]!.key) {
			// common tail — patch in place
			transferListItemData(oldItems[oldEnd]!, newItems[newEnd]!, update, noWatch);
			oldEnd--;
			newEnd--;
		} else if (oldItems[oldStart]!.key === newItems[newEnd]!.key) {
			// rotated head → tail: move the old head to just past the old tail
			moveRegion(parent, oldItems[oldStart]!, oldItems[oldEnd]!.endNode?.nextSibling ?? anchor);
			transferListItemData(oldItems[oldStart]!, newItems[newEnd]!, update, noWatch);
			oldStart++;
			newEnd--;
		} else if (oldItems[oldEnd]!.key === newItems[newStart]!.key) {
			// rotated tail → head: move the old tail to just before the old head
			moveRegion(parent, oldItems[oldEnd]!, oldItems[oldStart]!.startNode);
			transferListItemData(oldItems[oldEnd]!, newItems[newStart]!, update, noWatch);
			oldEnd--;
			newStart++;
		} else {
			break;
		}
	}

	// 2. Old middle exhausted → mount remaining new middle (common: append,
	//    fresh create, or prefix-only change). Insert before the first suffix
	//    node (or the list anchor if there's no suffix).
	if (oldStart > oldEnd) {
		const before = newEnd + 1 < newItems.length ? newItems[newEnd + 1]!.startNode : anchor;
		for (let i = newStart; i <= newEnd; i++) {
			mountItem(newItems[i]!, region, before, create, noWatch);
		}
	}
	// 3. New middle exhausted → clear remaining old middle (common: truncate).
	else if (newStart > newEnd) {
		for (let i = oldStart; i <= oldEnd; i++) {
			clearRegion(oldItems[i]!);
		}
	}
	// 4. Messy middle — LIS-based reconciliation (moves + mounts + clears).
	else {
		// 4a. Build newKey → newIndex for the new middle.
		const newKeyToIndex = new Map<unknown, number>();
		for (let i = newStart; i <= newEnd; i++) {
			newKeyToIndex.set(newItems[i]!.key, i);
		}

		// 4b. No-overlap fast path: every old middle key is absent from the new
		//    middle → full replacement. Batch-clear the old middle (reverse, so
		//    each region's DOM is still attached when clearRegion walks it) and
		//    batch-mount the new middle. Avoids the keymap/LIS allocation for
		//    the common "replace all" / "rebuild from scratch" case (e.g. `run`,
		//    `runlots`).
		let anyOverlap = false;
		for (let i = oldStart; i <= oldEnd; i++) {
			if (newKeyToIndex.has(oldItems[i]!.key)) {
				anyOverlap = true;
				break;
			}
		}
		if (!anyOverlap) {
			const lastOld = oldItems[oldEnd];
			let before = (lastOld?.endNode?.nextSibling ?? anchor) as Node | null;
			for (let i = oldEnd; i >= oldStart; i--) {
				clearRegion(oldItems[i]!);
			}
			for (let i = newStart; i <= newEnd; i++) {
				mountItem(newItems[i]!, region, before, create, noWatch);
				before = newItems[i]!.endNode!.nextSibling;
			}
		} else {
			// 4c. Walk the old middle: patch matches into their new positions and
			//    clear the rest. `newIndexToOld[i] = oldIndex + 1` (0 marks a new
			//    slot that has no matching old item and must be mounted).
			const newMidLen = newEnd - newStart + 1;
			const newIndexToOld = new Array<number>(newMidLen).fill(0);
			for (let i = oldStart; i <= oldEnd; i++) {
				const oldItem = oldItems[i]!;
				const newIdx = newKeyToIndex.get(oldItem.key);
				if (newIdx !== undefined) {
					newIndexToOld[newIdx - newStart] = i + 1;
					transferListItemData(oldItem, newItems[newIdx]!, update, noWatch);
				} else {
					clearRegion(oldItem);
				}
			}

			// 4d. LIS of `newIndexToOld` → indices of items already in correct
			//    relative order (they stay; everything else moves or mounts).
			const seq = getSequence(newIndexToOld);

			// 4e. Move/mount right-to-left. The right neighbour (newIdx+1) was
			//    placed in the previous iteration (or is a patched suffix item),
			//    so its `startNode` is the correct insertion anchor.
			let j = seq.length - 1;
			for (let i = newMidLen - 1; i >= 0; i--) {
				const newIdx = newStart + i;
				const newItem = newItems[newIdx]!;
				const before = newIdx + 1 < newItems.length ? newItems[newIdx + 1]!.startNode : anchor;
				if (newIndexToOld[i] === 0) {
					// No matching old item → mount.
					mountItem(newItem, region, before, create, noWatch);
				} else if (j < 0 || i !== seq[j]) {
					// Not in the LIS → move to its new position.
					moveRegion(parent, newItem, before);
				} else {
					// In the LIS → already in correct relative order.
					j--;
				}
			}
		}
	}

	// Connect the list region to the (possibly new) first child. When the new
	// list is empty, restore the old tail's next link.
	if (newItems.length > 0) {
		region.nextRegion = newItems[0]!;
		// The list region was pushed as a sibling (via `pushRegion(region, …)`
		// in `runList`), which set `context.previousRegion = region`. The items
		// are now the chain's tail at this depth, so the NEXT sibling region
		// pushed after us (e.g. a following `@if`/`@for`) must link after the
		// last item — otherwise it would link after the list region itself,
		// adopt the first item as its `nextRegion`, and `runControlBranch` would
		// `clearRegion` that item on its first branch run. `mountItem`
		// deliberately doesn't touch the chain (see comment above), so restore
		// the tail pointer here, once, covering every reconciliation path.
		context.previousRegion = newItems[newItems.length - 1]!;
	} else if (oldItems.length > 0) {
		region.nextRegion = oldItems[oldItems.length - 1]!.nextRegion;
	}
}

function transferListItemData(
	oldItem: ListItem,
	newItem: ListItem,
	update: (oldItem: ListItem, newItem: ListItem) => void,
	noWatch?: boolean,
): void {
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
