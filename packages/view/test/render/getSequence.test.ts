import { expect, test } from "vite-plus/test";
import getSequence from "../../src/render/getSequence";

// `getSequence` returns the indices (into `arr`) of a longest strictly-
// increasing subsequence, skipping zero entries. The keyed-list reconciler
// feeds it a `newIndexToOld` map where `arr[i] = oldIndex + 1` (so `0` marks a
// newly-mounted slot) and uses the result to decide which already-placed items
// are in correct relative order and therefore don't need a DOM move.
//
// The cases below use realistic `newIndexToOld` shapes produced by the
// reconciler for common reorderings of an `old = [A, B, C, D]` list.

test("single matched item stays in place", () => {
	expect(getSequence([1])).toEqual([0]);
});

test("already-ordered items are all kept (no moves)", () => {
	// old [A,B,C], new [A,B,C] → arr = [1,2,3]
	expect(getSequence([1, 2, 3])).toEqual([0, 1, 2]);
});

test("fully reversed list keeps exactly one item", () => {
	// old [A,B,C], new [C,B,A] → arr = [3,2,1]; LIS length 1
	expect(getSequence([3, 2, 1])).toEqual([2]);
});

test("prepend a new item keeps the existing run", () => {
	// old [A,B], new [X,A,B] → arr = [0,1,2] (X is new)
	expect(getSequence([0, 1, 2])).toEqual([0, 1, 2]);
});

test("append a new item keeps the existing run", () => {
	// old [A,B], new [A,B,X] → arr = [1,2,0] (X is new)
	expect(getSequence([1, 2, 0])).toEqual([0, 1]);
});

test("insert a new item in the middle keeps both runs", () => {
	// old [A,B,C,D], new [A,B,X,C,D] → arr = [1,2,0,3,4] (X is new)
	expect(getSequence([1, 2, 0, 3, 4])).toEqual([0, 1, 3, 4]);
});

test("move first item to the end moves only that item", () => {
	// old [A,B,C,D], new [B,C,D,A] → arr = [2,3,4,1]; LIS = [2,3,4] @ [0,1,2]
	expect(getSequence([2, 3, 4, 1])).toEqual([0, 1, 2]);
});

test("move last item to the front moves only that item", () => {
	// old [A,B,C,D], new [D,A,B,C] → arr = [4,1,2,3]; LIS = [1,2,3] @ [1,2,3]
	expect(getSequence([4, 1, 2, 3])).toEqual([1, 2, 3]);
});

test("swap first two items moves only one of them", () => {
	// old [A,B,C,D], new [B,A,C,D] → arr = [2,1,3,4]; LIS length 3
	const seq = getSequence([2, 1, 3, 4]);
	expect(seq).toEqual([1, 2, 3]);
	expect(seq.length).toBe(3);
});

test("new items (zeros) interspersed do not break the subsequence", () => {
	// old [A,B,C,D], new [X,A,Y,B,C,Z,D] → arr = [0,1,0,2,3,0,4]
	expect(getSequence([0, 1, 0, 2, 3, 0, 4])).toEqual([0, 1, 3, 4, 6]);
});

test("subsequence is always strictly increasing by value", () => {
	const arr = [5, 2, 8, 6, 3, 9, 1];
	const seq = getSequence(arr);
	const values = seq.map((i) => arr[i]);
	for (let i = 1; i < values.length; i++) {
		expect(values[i]).toBeGreaterThan(values[i - 1]!);
	}
});

test("returned indices are all valid and unique", () => {
	const arr = [3, 1, 4, 1, 5, 9, 2, 6];
	const seq = getSequence(arr);
	expect(new Set(seq).size).toBe(seq.length);
	for (const i of seq) {
		expect(i).toBeGreaterThanOrEqual(0);
		expect(i).toBeLessThan(arr.length);
	}
});
