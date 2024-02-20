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
import type ListItem from "../../types/ListItem";
import clearRange from "./clearRange";
import moveRange from "./moveRange";

/**
 * @param parent The parent DOM element
 * @param oldItems The list of current items
 * @param newItems The list of future items
 * @param create A function that creates the DOM elements for a new item
 */
export default (
  parent: Node,
  oldItems: ListItem[],
  newItems: ListItem[],
  create: (parent: Node, data: ListItem, before: Node | null) => void,
) => {
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
      moveRange(
        parent,
        oldStartItem.anchor,
        oldStartItem.endNode,
        oldEndItem?.endNode?.nextSibling,
      );
      transferRangeMarkers(oldStartItem, newEndItem);
      oldStartItem = oldItems[++oldStartIndex];
      newEndItem = newItems[--newEndIndex];
    } else if (oldEndItem.key === newStartItem.key) {
      // Move to the start
      //console.log("move", oldEndItem.key, "to the start");
      moveRange(parent, oldEndItem.anchor, oldEndItem.endNode, oldStartItem?.anchor);
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
        create(parent, newStartItem, oldStartItem.anchor);
        clearRange(oldStartItem.anchor, oldStartItem.endNode, true);
        oldStartItem = oldItems[++oldStartIndex];
        newStartItem = newItems[++newStartIndex];
      } else if (oldIndex === undefined) {
        // Insert
        //console.log("insert", newStartItem.key);
        create(parent, newStartItem, oldStartItem.anchor);
        newStartItem = newItems[++newStartIndex];
      } else if (newIndex === undefined) {
        // Delete
        //console.log("delete", oldStartItem.key);
        clearRange(oldStartItem.anchor, oldStartItem.endNode, true);
        oldStartItem = oldItems[++oldStartIndex];
      } else {
        // Move
        //console.log("move", newStartItem.key, "before", oldStartItem.key);
        const oldData = oldItems[oldIndex];
        moveRange(parent, oldData.anchor, oldData.endNode, oldStartItem.anchor);
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
        oldStartItem?.anchor || oldItems[oldItems.length - 1]?.endNode?.nextSibling;
      for (newStartIndex; newStartIndex <= newEndIndex; newStartItem = newItems[++newStartIndex]) {
        //console.log("create", newStartItem.key, newStartItem.endNode);
        create(parent, newStartItem, before);
        before = newStartItem.endNode.nextSibling;
      }
    } else {
      // The new list is exhausted; process old list removals
      //console.log("clear", oldItems[oldStartIndex].key, oldItems[oldEndIndex].key);
      const startNode = oldItems[oldStartIndex].anchor;
      const endNode = oldItems[oldEndIndex].endNode;
      clearRange(startNode, endNode, true);
    }
  }
};

function transferRangeMarkers(oldItem: ListItem, newItem: ListItem) {
  newItem.anchor = oldItem.anchor;
  newItem.endNode = oldItem.endNode;
}
