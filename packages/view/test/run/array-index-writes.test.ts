import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

// Regression tests: a direct array index write used to propagate `length`
// unconditionally, re-running every length reader (e.g. each `@for` list) even
// when the length didn't change. Content readers (iteration, read methods)
// still need to re-run when an element is replaced, so index writes notify a
// separate content signal.

test("index writes don't notify length readers when the length is unchanged", () => {
	const $state = $watch({ rows: [1, 2, 3] });

	let lengthRuns = 0;
	$run(() => {
		lengthRuns++;
		void $state.rows.length;
	});

	expect(lengthRuns).toBe(1);

	$state.rows[0] = 9;
	expect($state.rows[0]).toBe(9);
	expect(lengthRuns).toBe(1);
});

test("index writes that extend the array still notify length readers", () => {
	const $state = $watch<{ rows: number[] }>({ rows: [1, 2, 3] });

	let lengthRuns = 0;
	let length = 0;
	$run(() => {
		lengthRuns++;
		length = $state.rows.length;
	});

	expect(lengthRuns).toBe(1);

	$state.rows[5] = 9;
	expect(length).toBe(6);
	expect(lengthRuns).toBe(2);
});

test("iteration re-runs when an element is replaced", () => {
	const $state = $watch({ rows: [1, 2, 3] });

	let seen: number[] = [];
	$run(() => {
		seen = [];
		for (const row of $state.rows) seen.push(row);
	});

	expect(seen).toEqual([1, 2, 3]);

	$state.rows[1] = 20;
	expect(seen).toEqual([1, 20, 3]);
});

test("read methods re-run when an element is replaced", () => {
	const $state = $watch({ rows: [1, 2, 3] });

	let even: number[] = [];
	$run(() => {
		even = $state.rows.filter((n) => n % 2 === 0);
	});

	expect(even).toEqual([2]);

	$state.rows[0] = 4;
	expect(even).toEqual([4, 2]);

	// A same-length replacement with the same derived result still re-runs
	// (contents changed), which is correct — just not the over-broad `length`
	// re-run this test is about elsewhere
	$state.rows[0] = 6;
	expect(even).toEqual([6, 2]);
});
