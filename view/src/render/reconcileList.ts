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
import clearRange from "./clearRange";
import moveRange from "./moveRange";

/**
 * @param parent The parent DOM element
 * @param oldCh The list of current items
 * @param newCh The list of future items
 * @param before The element to insert new items before
 * @param create A function that creates a new item
 */
export default (
  parentElm: Node,
  oldCh: ListItem[],
  newCh: ListItem[],
  before: Node | null,
  create: (parent: Node, data: ListItem, before: Node | null) => void,
) => {
  let oldStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];

  let newStartIdx = 0;
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];

  let oldKeyToIdx: Map<any, number> | undefined;
  let newKeyToIdx: Map<any, number> | undefined;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx];
    } else if (oldStartVnode.key === newStartVnode.key) {
      transferRangeMarkers(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (oldEndVnode.key === newEndVnode.key) {
      transferRangeMarkers(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (oldStartVnode.key === newEndVnode.key) {
      // Move to the end
      //console.log("move", oldStartVnode.key, "to the end");
      moveRange(
        parentElm,
        oldStartVnode.anchor,
        oldStartVnode.endNode,
        oldEndVnode?.endNode?.nextSibling,
      );
      transferRangeMarkers(oldStartVnode, newEndVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (oldEndVnode.key === newStartVnode.key) {
      // Move to the start
      //console.log("move", oldEndVnode.key, "to the start");
      moveRange(parentElm, oldEndVnode.anchor, oldEndVnode.endNode, oldStartVnode?.anchor);
      transferRangeMarkers(oldEndVnode, newStartVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // Lazily build maps of keys to indexes here
      // They are relevant only if there has been a move, or a mid-list
      // insertion or deletion, and not if there has been an insertion
      // at the end or deletion from the front
      if (!oldKeyToIdx || !newKeyToIdx) {
        oldKeyToIdx = new Map();
        for (let i = oldStartIdx; i < oldEndIdx; i++) {
          oldKeyToIdx.set(oldCh[i].key, i);
        }
        newKeyToIdx = new Map();
        for (let i = newStartIdx; i < newEndIdx; i++) {
          newKeyToIdx.set(newCh[i].key, i);
        }
      }

      let oldIndex = oldKeyToIdx.get(newStartVnode.key);
      let newIndex = newKeyToIdx.get(oldStartVnode.key);

      if (oldIndex === undefined && newIndex === undefined) {
        // Replace
        //console.log("replace", oldStartVnode.key, "with", newStartVnode.key);
        create(parentElm, newStartVnode, oldStartVnode.anchor);
        clearRange(oldStartVnode.anchor, oldStartVnode.endNode);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (oldIndex === undefined) {
        // Insert
        //console.log("insert", newStartVnode.key);
        create(parentElm, newStartVnode, oldStartVnode.anchor);
        newStartVnode = newCh[++newStartIdx];
      } else if (newIndex === undefined) {
        // Delete
        //console.log("delete", oldStartVnode.key);
        clearRange(oldStartVnode.anchor, oldStartVnode.endNode, true);
        oldStartVnode = oldCh[++oldStartIdx];
      } else {
        // Move
        //console.log("move", newStartVnode.key, "before", oldStartVnode.key);
        const oldData = oldCh[oldIndex];
        moveRange(parentElm, oldData.anchor, oldData.endNode, oldStartVnode.anchor);
        transferRangeMarkers(oldData, newStartVnode);
        // @ts-ignore TODO: Set key null instead?
        oldCh[oldIndex] = null;
        newStartVnode = newCh[++newStartIdx];
      }
    }
  }

  // HACK: I haven't found a situation in which these if statements
  // make a difference, but they might need to go back in
  //if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
  //  if (oldStartIdx > oldEndIdx) {
  // The old list is exhausted; process new list additions
  for (newStartIdx; newStartIdx <= newEndIdx; newStartVnode = newCh[++newStartIdx]) {
    //console.log("create", newStartVnode.key);
    create(parentElm, newStartVnode, oldStartVnode?.anchor);
  }
  //  } else {
  // The new list is exhausted; process old list removals
  for (oldStartIdx; oldStartIdx <= oldEndIdx; oldStartVnode = oldCh[++oldStartIdx]) {
    //console.log("clear", oldCh[oldStartIdx].key);
    clearRange(oldStartVnode.anchor, oldStartVnode.endNode, true);
  }
  //  }
  //}

  //return newCh;
};

function transferRangeMarkers(oldData: ListItem, newData: ListItem) {
  newData.anchor = oldData.anchor;
  newData.endNode = oldData.endNode;
}
