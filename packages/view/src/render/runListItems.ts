// Keyed list reconciliation with survivor reuse.
//
// The compiler-emitted `buildItems` callback returns a lightweight array of
// `ListItemSpec`s ({key, data}) — one per row of the new data, with no DOM
// nodes, effects, or sibling-chain pointers. This reconciler maps each spec
// to either an EXISTING old ListItem (matched by key, reused wholesale — its
// DOM nodes, effects, and depth are already correct) or a freshly mounted
// ListItem (for genuinely new keys). This keeps the per-update cost
// proportional to what actually changed: a single remove from a 1000-row list
// touches one clearRegion, not a full per-row field-shuffle across all 999
// survivors.
//
// Replaces an earlier snabbdom-derived 4-way head/tail heuristic with a
// prefix/suffix sync + longest-increasing-subsequence (LIS) pass, which
// produces the minimal move set. Operations (`moveRegion` / `mountSpec` /
// `clearRegion`) and the LIS are unchanged in spirit from the
// transferListItemData-based version — only the survivor handling is smarter
// (reuse vs. copy-back).
//
// The sibling region chain (`previousRegion`/`nextRegion`) is relinked ONCE
// at the end from the final item order. Nothing during reconciliation reads
// it (moves and mounts use DOM `startNode`/`endNode`; `clearRegion` walks
// each cleared region's own subtree), so a single end-of-pass relink is
// sufficient and gives a clean invariant regardless of which path produced
// `newItems`. This means `buildItems` no longer pre-links the chain.
import type ListItem from "../types/ListItem";
import type ListItemSpec from "../types/ListItemSpec";
import type Region from "../types/Region";
import type WatchOptions from "../types/WatchOptions";
import $watch from "../watch/$watch";
import clearRegion from "./clearRegion";
import context from "./context";
import getSequence from "./getSequence";
import moveRegion from "./moveRegion";
import newListItem from "./newListItem";

// Hoisted options object — `$watch` only reads `options?.shallow`, so a single
// shared constant can serve every per-item `$watch(data, { shallow: true })`
// call in the mount path below. Removes one object allocation per mounted
// list item (i.e. one per row in `run`/`add`/`runlots`).
const SHALLOW_WATCH_OPTIONS: WatchOptions = { shallow: true };

/**
 * Mounts a new list item from a spec: allocates the ListItem, establishes it
 * as the active region (so the compiler-emitted `create` callback attaches
 * effects/events to the right region), sets its depth, optionally wraps its
 * data in a shallow watch, then runs `create`. Returns the mounted item so the
 * caller can slot it into the live list. The sibling chain is left for the
 * end-of-pass relink.
 */
function mountSpec(
	spec: ListItemSpec,
	region: Region,
	before: Node | null,
	create: (item: ListItem, before: Node | null) => void,
	noWatch?: boolean,
): ListItem {
	const item: ListItem = newListItem(spec.data, spec.key);
	const savedActiveRegion = context.activeRegion;
	item.depth = region.depth + 1;
	context.activeRegion = item;
	if (noWatch !== true) {
		item.data = $watch(item.data, SHALLOW_WATCH_OPTIONS);
	}
	create(item, before);
	context.activeRegion = savedActiveRegion;
	return item;
}

/**
 * Reconciles an old keyed list against a new keyed list, reusing old
 * ListItems for survivors and producing the minimal set of DOM moves /
 * mounts / clears.
 *
 * @returns The new live list of ListItems (reused old items + freshly
 *   mounted ones), which the caller keeps for the next reconciliation.
 *
 * @param region The list's region
 * @param parent The parent DOM element
 * @param anchor The DOM node to create new items before (the list's trailing anchor)
 * @param oldItems The list of current (live) items from the previous run
 * @param newSpecs The lightweight {key, data} specs for the new data
 * @param create A function that creates the DOM elements for a new item
 * @param update A function that syncs a matched item's data from its spec
 *   (re-runs effects if a loop variable's reference actually changed)
 * @param noWatch When true, skip the per-item shallow `$watch` wrap. The
 *   compiler guarantees the `@for` body never writes to its loop variables,
 *   and emits an `update` callback that re-runs item effects manually when a
 *   loop variable's reference actually changes (via `t_rerun_region_effects`).
 */
export default function runListItems(
	region: Region,
	parent: ParentNode,
	anchor: Node | null,
	oldItems: ListItem[],
	newSpecs: ListItemSpec[],
	create: (item: ListItem, before: Node | null) => void,
	update: (oldItem: ListItem, newSpec: ListItemSpec) => void,
	noWatch?: boolean,
): ListItem[] {
	const newItems: ListItem[] = new Array(newSpecs.length);

	// Capture the region that follows the entire list BEFORE reconciliation —
	// `clearRegion` during the messy middle releases old items and nulls their
	// chain pointers, so the only safe moment to read the list's trailing
	// sibling is now. When the list has items, that sibling lives on the old
	// last item's `nextRegion`; when the list is empty, it lives on the list
	// region's own `nextRegion` (set by `pushRegion(region, true)` on first
	// mount, or by a prior empty-list pass through the relink below).
	const nextSibling: Region | null =
		oldItems.length > 0 ? oldItems[oldItems.length - 1]!.nextRegion : region.nextRegion;

	let oldStart = 0;
	let oldEnd = oldItems.length - 1;
	let newStart = 0;
	let newEnd = newSpecs.length - 1;

	// 1. Fast path: peel off matching heads/tails and boundary rotations
	//    (head→tail / tail→head) one item at a time, without building a
	//    keymap. This handles append / prepend / swap / rotate and the
	//    common-prefix/suffix portions of any change in O(1) per item.
	//    rotateb/rotatef land here entirely (no keymap, no LIS). When no
	//    boundary key matches, break and fall through to the LIS pass for
	//    the messy middle (displace/shuffle). On a match we REUSE the old
	//    ListItem (DOM nodes, effects, depth already correct) and just call
	//    `update` to sync the spec's data references.
	while (oldStart <= oldEnd && newStart <= newEnd) {
		if (oldItems[oldStart]!.key === newSpecs[newStart]!.key) {
			// common head — reuse the survivor in place
			const item = oldItems[oldStart]!;
			update(item, newSpecs[newStart]!);
			newItems[newStart] = item;
			oldStart++;
			newStart++;
		} else if (oldItems[oldEnd]!.key === newSpecs[newEnd]!.key) {
			// common tail — reuse the survivor in place
			const item = oldItems[oldEnd]!;
			update(item, newSpecs[newEnd]!);
			newItems[newEnd] = item;
			oldEnd--;
			newEnd--;
		} else if (oldItems[oldStart]!.key === newSpecs[newEnd]!.key) {
			// rotated head → tail: move the old head to just past the old tail
			const item = oldItems[oldStart]!;
			moveRegion(parent, item, oldItems[oldEnd]!.endNode?.nextSibling ?? anchor);
			update(item, newSpecs[newEnd]!);
			newItems[newEnd] = item;
			oldStart++;
			newEnd--;
		} else if (oldItems[oldEnd]!.key === newSpecs[newStart]!.key) {
			// rotated tail → head: move the old tail to just before the old head
			const item = oldItems[oldEnd]!;
			moveRegion(parent, item, oldItems[oldStart]!.startNode);
			update(item, newSpecs[newStart]!);
			newItems[newStart] = item;
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
		const before = newEnd + 1 < newSpecs.length ? newItems[newEnd + 1]!.startNode : anchor;
		for (let i = newStart; i <= newEnd; i++) {
			newItems[i] = mountSpec(newSpecs[i]!, region, before, create, noWatch);
		}
	}
	// 3. New middle exhausted → clear remaining old middle (common: truncate / remove).
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
			newKeyToIndex.set(newSpecs[i]!.key, i);
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
				newItems[i] = mountSpec(newSpecs[i]!, region, before, create, noWatch);
				before = newItems[i]!.endNode!.nextSibling;
			}
		} else {
			// 4c. Walk the old middle: reuse matches into their new positions
			//     (via update) and clear the rest. `newIndexToOld[i] = oldIndex
			//     + 1` (0 marks a new slot that has no matching old item and
			//     must be mounted).
			const newMidLen = newEnd - newStart + 1;
			const newIndexToOld = new Array<number>(newMidLen).fill(0);
			for (let i = oldStart; i <= oldEnd; i++) {
				const oldItem = oldItems[i]!;
				const newIdx = newKeyToIndex.get(oldItem.key);
				if (newIdx !== undefined) {
					newIndexToOld[newIdx - newStart] = i + 1;
					update(oldItem, newSpecs[newIdx]!);
					newItems[newIdx] = oldItem;
				} else {
					clearRegion(oldItem);
				}
			}

			// 4d. LIS of `newIndexToOld` → indices of items already in correct
			//     relative order (they stay; everything else moves or mounts).
			const seq = getSequence(newIndexToOld);

			// 4e. Move/mount right-to-left. The right neighbour (newIdx+1) was
			//     placed in the previous iteration (or is a patched suffix
			//     item), so its `startNode` is the correct insertion anchor.
			let j = seq.length - 1;
			for (let i = newMidLen - 1; i >= 0; i--) {
				const newIdx = newStart + i;
				const before =
					newIdx + 1 < newSpecs.length ? newItems[newIdx + 1]!.startNode : anchor;
				if (newIndexToOld[i] === 0) {
					// No matching old item → mount.
					newItems[newIdx] = mountSpec(newSpecs[newIdx]!, region, before, create, noWatch);
				} else if (j < 0 || i !== seq[j]) {
					// Not in the LIS → move to its new position.
					moveRegion(parent, newItems[newIdx]!, before);
				} else {
					// In the LIS → already in correct relative order.
					j--;
				}
			}
		}
	}

	// 5. Relink the sibling region chain across the final items, in order.
	//    Nothing during reconciliation reads `previousRegion`/`nextRegion`
	//    (moves and mounts use DOM `startNode`/`endNode`; `clearRegion` walks
	//    each cleared region's own subtree and unlinks the cleared node from
	//    its then-current neighbours), so a single end-of-pass relink from the
	//    final `newItems` order is correct regardless of which path produced
	//    it. This replaces the old design where `buildItems` pre-linked the
	//    chain and `transferListItemData` copied it field-by-field.
	//
	//    The chain is a flat doubly-linked list in render order, with `depth`
	//    marking nesting. A @for item at depth D may own descendant regions
	//    (e.g. an `@if` body) at D+1 linked off `item.nextRegion`. So siblings
	//    must link through each item's LAST DESCENDANT (walk `nextRegion` while
	//    it's deeper than the item), not through the item itself — otherwise
	//    the item→child link gets overwritten and `clearRegion` can no longer
	//    walk the subtree to run cleanups on removal.
	if (newItems.length > 0) {
		let prevTail: Region = region;
		for (let i = 0; i < newItems.length; i++) {
			const item = newItems[i]!;
			item.previousRegion = prevTail;
			prevTail.nextRegion = item;
			// Advance to the last region in this item's subtree: follow
			// `nextRegion` as long as it descends deeper than the item. A leaf
			// row has no descendants, so `last` stays `item` and the next
			// iteration's `prevTail.nextRegion = nextItem` updates the item's
			// own `nextRegion` (preserving the old sibling-only behaviour).
			let last: Region = item;
			let next: Region | null = item.nextRegion;
			while (next !== null && next.depth > item.depth) {
				last = next;
				next = next.nextRegion;
			}
			prevTail = last;
		}
		// `prevTail` is now the very last region in the list. Link it to
		// whatever followed the list, and publish it as the insertion point
		// for the next sibling region pushed after us.
		prevTail.nextRegion = nextSibling;
		if (nextSibling !== null) {
			nextSibling.previousRegion = prevTail;
		}
		region.nextRegion = newItems[0]!;
		context.previousRegion = prevTail;
	} else {
		// Empty list: link the list region directly to its trailing sibling,
		// and publish the list region itself as the insertion point for the
		// next sibling region pushed after us.
		region.nextRegion = nextSibling;
		if (nextSibling !== null) {
			nextSibling.previousRegion = region;
		}
		context.previousRegion = region;
	}

	return newItems;
}
