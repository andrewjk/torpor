/**
 * Pure helpers for reorderable collections, used by list and tree drag &
 * drop. Geometry-free on purpose: components measure their own slots with
 * slotIndex and combine the result with these.
 */

/** Moves an item to a final index; out-of-range targets are clamped */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
	const next = items.slice();
	if (from < 0 || from >= next.length) return next;
	const clamped = Math.min(next.length - 1, Math.max(0, to));
	const [item] = next.splice(from, 1);
	next.splice(clamped, 0, item);
	return next;
}

/**
 * Moves an item to sit at the slot `insertAt` occupied *before* the move --
 * i.e. `insertAt` indexes into the original order, which is what pointer
 * math produces (dropped before item N). Handles the index shift caused by
 * removing the dragged element.
 */
export function moveToSlot<T>(items: T[], from: number, insertAt: number): T[] {
	let to = insertAt;
	if (from < insertAt) {
		to = insertAt - 1;
	}
	return moveItem(items, from, to);
}

/**
 * Finds which slot a pointer sits in along an axis: the index of the first
 * element whose midpoint the point has passed (or elements.length when past
 * all of them). `elements` must already be in display order.
 *
 * ```
 * const insert = slotIndex([...list.children], "y", e.clientY);
 * list.set(items => moveToSlot(items, dragFrom, insert));
 * ```
 */
export function slotIndex(
	elements: { getBoundingClientRect(): DOMRect }[],
	axis: "x" | "y",
	point: number,
): number {
	for (let i = 0; i < elements.length; i++) {
		const rect = elements[i].getBoundingClientRect();
		const mid = axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
		if (point < mid) return i;
	}
	return elements.length;
}
