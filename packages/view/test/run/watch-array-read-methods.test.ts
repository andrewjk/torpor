import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

// Regression tests: array read methods run on the raw target for speed, so
// their callback parameters and returned elements used to be raw objects —
// reads inside the callbacks weren't tracked and mutating a returned element
// didn't notify anything.

test("filter callback reads are tracked", () => {
	const $state = $watch({ todos: [{ done: false }, { done: false }] });

	let remaining = 0;
	$run(() => {
		remaining = $state.todos.filter((t) => !t.done).length;
	});

	expect(remaining).toBe(2);

	$state.todos[0].done = true;
	expect(remaining).toBe(1);
});

test("find returns a reactive element", () => {
	const $state = $watch({
		todos: [
			{ id: 1, done: false },
			{ id: 2, done: false },
		],
	});

	let done = false;
	$run(() => {
		done = $state.todos.find((t) => t.id === 1)!.done;
	});

	expect(done).toBe(false);

	// Mutating the element returned by `find` (a raw object before the fix)
	// must re-run the effect
	$state.todos.find((t) => t.id === 1)!.done = true;
	expect(done).toBe(true);
});

test("map / reduce callback reads are tracked", () => {
	const $state = $watch({ rows: [{ n: 1 }, { n: 2 }] });

	let total = 0;
	$run(() => {
		total = $state.rows.map((r) => r.n).reduce((a, b) => a + b, 0);
	});

	expect(total).toBe(3);

	$state.rows[1].n = 10;
	expect(total).toBe(11);
});

test("slice / at / toReversed results are reactive elements", () => {
	const $state = $watch({ rows: [{ n: 1 }, { n: 2 }] });

	let first = 0;
	let last = 0;
	$run(() => {
		first = $state.rows.at(0)!.n;
		last = $state.rows.slice(1)[0]!.n;
	});

	expect(first).toBe(1);
	expect(last).toBe(2);

	$state.rows.at(0)!.n = 5;
	expect(first).toBe(5);

	$state.rows.slice(1)[0]!.n = 6;
	expect(last).toBe(6);

	// Negative `at` indexes work too, and the element it returns is reactive
	const lastRow = $state.rows.at(-1)!;
	lastRow.n = 7;
	expect($state.rows[1]!.n).toBe(7);
});

test("indexOf / lastIndexOf / includes find raw and wrapped elements", () => {
	const a = { id: 1 };
	const b = { id: 2 };
	const c = { id: 3 };
	const $state = $watch({ rows: [a, b, c] });

	// Before anything wraps the elements
	expect($state.rows.indexOf(a)).toBe(0);
	expect($state.rows.indexOf(b)).toBe(1);
	expect($state.rows.lastIndexOf(c)).toBe(2);
	expect($state.rows.includes(b)).toBe(true);

	// Reading through a read method wraps the elements and writes the proxies
	// back, replacing the raw objects in the array
	$state.rows.filter(() => true);
	expect([...$state.rows].length).toBe(3);

	// The raw objects still find their proxies
	expect($state.rows.indexOf(a)).toBe(0);
	expect($state.rows.indexOf(b)).toBe(1);
	expect($state.rows.lastIndexOf(c)).toBe(2);
	expect($state.rows.includes(c)).toBe(true);

	// Proxy arguments work too
	const found = $state.rows.find((r) => r.id === 2)!;
	expect($state.rows.indexOf(found)).toBe(1);
	expect($state.rows.includes(found)).toBe(true);

	// And unrelated objects don't match
	expect($state.rows.indexOf({ id: 1 })).toBe(-1);
	expect($state.rows.includes({ id: 2 })).toBe(false);

	// Primitive searches still work (and NaN is SameValueZero for includes)
	const $numbers = $watch({ values: [1, NaN, 3] });
	expect($numbers.values.indexOf(3)).toBe(2);
	expect($numbers.values.includes(NaN)).toBe(true);
});
