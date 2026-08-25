/** Compares two cell values, handling mixed types and nullish values */
function compareValues(a: any, b: any): number {
	if (a == null && b == null) return 0;
	if (a == null) return -1;
	if (b == null) return 1;
	if (typeof a === "string" || typeof b === "string") {
		return String(a).localeCompare(String(b));
	}
	return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Sorts rows by the given column key (a shallow copy -- the source array is
 * not modified). Returns the rows unchanged when no sort is active.
 */
export default function sortRows<T>(
	rows: T[],
	sortBy: string | undefined,
	sortDirection: "asc" | "desc",
	columns: { key: string; getValue?: (row: T) => any }[],
): T[] {
	if (!sortBy) {
		return rows;
	}
	const column = columns.find((c) => c.key === sortBy);
	const getValue = column?.getValue ?? ((row: any) => row?.[sortBy]);
	const sorted = [...rows].sort((a, b) => compareValues(getValue(a), getValue(b)));
	if (sortDirection === "desc") {
		sorted.reverse();
	}
	return sorted;
}
