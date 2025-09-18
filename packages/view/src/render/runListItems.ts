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
import type Range from "../types/Range";
import $watch from "./$watch";
import clearRange from "./clearRange";
import context from "./context";
import moveRange from "./moveRange";

/**
 * @param range The list's range
 * @param parent The parent DOM element
 * @param anchor The DOM element to create new items before
 * @param oldItems The list of current items
 * @param newItems The list of future items
 * @param create A function that creates the DOM elements for a new item
 */
export default function runListItems(
	range: Range,
	parent: ParentNode,
	anchor: Node | null,
	oldItems: ListItem[],
	newItems: ListItem[],
	create: (data: ListItem, before: Node | null) => void,
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
		if (oldStartItem == null) {
			oldStartItem = oldItems[++oldStartIndex];
		} else if (oldEndItem == null) {
			oldEndItem = oldItems[--oldEndIndex];
		} else if (newStartItem == null) {
			newStartItem = newItems[++newStartIndex];
		} else if (newEndItem == null) {
			newEndItem = newItems[--newEndIndex];
		} else if (oldStartItem.key === newStartItem.key) {
			transferRangeMarkers(oldStartItem, newStartItem);
			oldStartItem = oldItems[++oldStartIndex];
			newStartItem = newItems[++newStartIndex];
		} else if (oldEndItem.key === newEndItem.key) {
			transferRangeMarkers(oldEndItem, newEndItem);
			oldEndItem = oldItems[--oldEndIndex];
			newEndItem = newItems[--newEndIndex];
		} else if (oldStartItem.key === newEndItem.key) {
			// Move to the end
			//console.log("move", oldStartItem.key, "to the end");
			moveRange(parent, oldStartItem, oldEndItem.endNode!.nextSibling!);
			transferRangeMarkers(oldStartItem, newEndItem);
			oldStartItem = oldItems[++oldStartIndex];
			newEndItem = newItems[--newEndIndex];
		} else if (oldEndItem.key === newStartItem.key) {
			// Move to the start
			//console.log("move", oldEndItem.key, "to the start");
			moveRange(parent, oldEndItem, oldStartItem?.startNode);
			transferRangeMarkers(oldEndItem, newStartItem);
			oldEndItem = oldItems[--oldEndIndex];
			newStartItem = newItems[++newStartIndex];
		} else {
			// Lazily build maps of keys to indexes here
			// They are relevant only if there has been a move, or a mid-list
			// insertion or deletion, and not if there has been an insertion
			// at the end or deletion from the front
			if (!oldKeyToIndex || !newKeyToIndex) {
				oldKeyToIndex = new Map();
				for (let i = oldStartIndex; i < oldEndIndex; i++) {
					oldKeyToIndex.set(oldItems[i].key, i);
				}
				newKeyToIndex = new Map();
				for (let i = newStartIndex; i < newEndIndex; i++) {
					newKeyToIndex.set(newItems[i].key, i);
				}
			}

			let oldIndex = oldKeyToIndex.get(newStartItem.key);
			let newIndex = newKeyToIndex.get(oldStartItem.key);

			if (oldIndex === undefined && newIndex === undefined) {
				// Replace
				//console.log("replace", oldStartItem.key, "with", newStartItem.key);
				newStartItem.data = $watch(newStartItem.data);
				create(newStartItem, oldStartItem.startNode);
				clearRange(oldStartItem);
				// @ts-ignore We know we have an active range (the for loop) and that it
				// has children (because we're replacing one)
				context.activeRange.children.splice(oldStartIndex, 1);
				oldStartItem = oldItems[++oldStartIndex];
				newStartItem = newItems[++newStartIndex];
			} else if (oldIndex === undefined) {
				// Insert
				//console.log("insert", newStartItem.key);
				newStartItem.data = $watch(newStartItem.data);
				create(newStartItem, oldStartItem.startNode);
				newStartItem = newItems[++newStartIndex];
			} else if (newIndex === undefined) {
				// Delete
				//console.log("delete", oldStartItem.key);
				clearRange(oldStartItem);
				// @ts-ignore We know we have an active range (the for loop) and that it
				// has children (because we're deleting one)
				context.activeRange.children.splice(oldStartIndex, 1);
				oldStartItem = oldItems[++oldStartIndex];
			} else {
				// Move
				//console.log("move", newStartItem.key, "before", oldStartItem.key);
				const oldData = oldItems[oldIndex];
				moveRange(parent, oldData, oldStartItem.startNode);
				transferRangeMarkers(oldData, newStartItem);
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
			let before: Node | null =
				oldStartItem?.startNode || oldItems[oldItems.length - 1]?.endNode?.nextSibling || anchor;
			for (newStartIndex; newStartIndex <= newEndIndex; newStartItem = newItems[++newStartIndex]) {
				//console.log("create", newStartItem.key);
				newStartItem.data = $watch(newStartItem.data);
				create(newStartItem, before!);
				before = newStartItem.endNode!.nextSibling!;
			}
		} else {
			// The new list is exhausted; process old list removals
			// Just truncate the parent range's children collection
			if (range.children) {
				range.children.length = oldStartIndex;
			}
			for (oldStartIndex; oldStartIndex <= oldEndIndex; oldStartItem = oldItems[++oldStartIndex]) {
				//console.log("clear", oldStartItem.key);
				clearRange(oldStartItem);
			}
		}
	}
}

function transferRangeMarkers(oldItem: ListItem, newItem: ListItem) {
	newItem.startNode = oldItem.startNode;
	newItem.endNode = oldItem.endNode;

	// Manually transfer the new data's props to the old ones (to run effects)
	// and then set the new data to the old one
	for (let prop in oldItem.data) {
		oldItem.data[prop] = newItem.data[prop];
	}
	newItem.data = oldItem.data;
}
