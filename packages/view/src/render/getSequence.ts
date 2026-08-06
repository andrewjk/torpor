/**
 * Computes the indices (into `arr`) of a longest strictly-increasing
 * subsequence, skipping zero entries. Adapted from Vue 3's `getSequence`.
 *
 * Used by the keyed-list reconciler (`runListItems`): `arr` is the
 * `newIndexToOldIndex` map where `arr[i] = oldIndex + 1` (so `0` marks a
 * new/unmounted slot, which is skipped). The returned indices identify the
 * items that are already in correct relative order and therefore don't need
 * to be moved — everything else is moved or mounted.
 *
 * Runs in O(n log n).
 */
export default function getSequence(arr: number[]): number[] {
	const p = arr.slice();
	const result = [0];
	let i: number;
	let j: number;
	let u: number;
	let v: number;
	let c: number;
	const len = arr.length;
	for (i = 0; i < len; i++) {
		const arrI = arr[i]!;
		if (arrI !== 0) {
			j = result[result.length - 1]!;
			if (arr[j]! < arrI) {
				p[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = (u + v) >> 1;
				if (arr[result[c]!]! < arrI) {
					u = c + 1;
				} else {
					v = c;
				}
			}
			if (arrI < arr[result[u]!]!) {
				if (u > 0) {
					p[i] = result[u - 1]!;
				}
				result[u] = i;
			}
		}
	}
	u = result.length;
	v = result[u - 1]!;
	while (u-- > 0) {
		result[u] = v;
		v = p[v]!;
	}
	return result;
}
