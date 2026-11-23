import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

// Regression test: inside an effect, after a `for…of`, spread or `Array.from`
// over a watched array, reads used to stop being tracked — the array iterator
// cleared the active effect and never restored it, so nothing read later in
// the effect (here `filter`) subscribed and the effect never re-ran.
test("effect tracks reads after iterating a watched array", () => {
	const $state = $watch({
		filter: "even",
		rows: [1, 2, 3, 4, 5],
	});

	let result: number[] = [];

	$run(() => {
		const all = [...$state.rows];
		result = $state.filter === "even" ? all.filter((r) => r % 2 === 0) : all;
	});

	expect(result).toEqual([2, 4]);

	// The read after the spread must be tracked
	$state.filter = "all";
	expect(result).toEqual([1, 2, 3, 4, 5]);

	// And so must the array itself
	$state.rows.push(6);
	expect(result).toEqual([1, 2, 3, 4, 5, 6]);
});

// Regression test: reads inside a `for…of` loop body used not to be tracked
// either (the iterator had already disabled the effect), so summing a field
// over a watched array never re-ran when a row's field changed.
test("effect tracks reads inside a for…of over a watched array", () => {
	const $state = $watch({
		rows: [{ amount: 1 }, { amount: 2 }],
	});

	let total = 0;

	$run(() => {
		total = 0;
		for (const row of $state.rows) {
			total += row.amount;
		}
	});

	expect(total).toBe(3);

	$state.rows[0].amount = 10;
	expect(total).toBe(12);
});

test("effect tracks Array.from over a watched array", () => {
	const $state = $watch({
		filter: "even",
		rows: [1, 2, 3, 4, 5],
	});

	let result: number[] = [];

	$run(() => {
		const all = Array.from($state.rows);
		result = $state.filter === "even" ? all.filter((r) => r % 2 === 0) : all;
	});

	expect(result).toEqual([2, 4]);

	$state.filter = "all";
	expect(result).toEqual([1, 2, 3, 4, 5]);
});
