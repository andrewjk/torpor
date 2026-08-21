export type FocusTarget = "start" | "previous" | "next" | "end";

/**
 * Standard keyboard navigation for a list of registered items: moves through
 * the items in the given direction and focuses the first one that isn't
 * disabled. Returns the new focus index, or the original when no focusable
 * item was found.
 */
export function focusItem<
	T extends { setFocused: () => void; disabled?: boolean },
>(items: T[], current: number, target: FocusTarget): number {
	if (items.length === 0) return current;
	let index = current;
	switch (target) {
		case "start": {
			index = 0;
			break;
		}
		case "previous": {
			index = Math.max(0, current - 1);
			break;
		}
		case "next": {
			index = Math.min(items.length - 1, current + 1);
			break;
		}
		case "end": {
			index = items.length - 1;
			break;
		}
	}
	// Skip disabled items, searching in the direction of travel
	const step = target === "previous" ? -1 : 1;
	while (index >= 0 && index < items.length && items[index].disabled) {
		index += step;
	}
	if (index < 0 || index >= items.length) {
		return current;
	}
	items[index].setFocused();
	return index;
}
