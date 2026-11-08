import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("adding a key re-runs an effect that used Object.keys", () => {
	let $state = $watch<{ a?: number; b?: number }>({ a: 1 });

	let keys: string[][] = [];
	$run(() => {
		keys.push(Object.keys($state));
	});

	// Initial run saw the one key
	expect(keys).toEqual([["a"]]);

	// Adding a key must notify the enumeration
	$state.b = 2;
	expect(keys.length).toBe(2);
	expect(keys[1]).toEqual(["a", "b"]);

	// Deleting a key too
	delete $state.a;
	expect(keys.length).toBe(3);
	expect(keys[2]).toEqual(["b"]);

	// Reassigning an EXISTING key is a value change, not a key-set change
	$state.b = 3;
	expect(keys.length).toBe(3);
});

test("adding a key re-runs an effect that used Object.values", () => {
	let $state = $watch<{ a?: number; b?: number }>({ a: 1 });

	let values: number[][] = [];
	$run(() => {
		values.push(Object.values($state));
	});

	expect(values).toEqual([[1]]);

	$state.b = 2;
	expect(values.length).toBe(2);
	expect(values[1]).toEqual([1, 2]);
});

test("adding a key re-runs an effect that iterated with for...in", () => {
	let $state = $watch<{ a?: number; b?: number }>({ a: 1 });

	let counts: number[] = [];
	$run(() => {
		let count = 0;
		for (const _key in $state) {
			count++;
		}
		counts.push(count);
	});

	expect(counts).toEqual([1]);

	$state.b = 2;
	expect(counts).toEqual([1, 2]);
});

test("structural array mutations notify Object.keys readers", () => {
	let $state = $watch<{ arr: string[] }>({ arr: ["a"] });

	let keys: string[][] = [];
	$run(() => {
		keys.push(Object.keys($state.arr));
	});

	expect(keys).toEqual([["0"]]);

	$state.arr.push("b");
	expect(keys.length).toBe(2);
	expect(keys[1]).toEqual(["0", "1"]);

	$state.arr.splice(0, 1);
	expect(keys.length).toBe(3);
	expect(keys[2]).toEqual(["0"]);
});

test("JSON.stringify re-runs when a key is added", () => {
	let $state = $watch<{ a?: number; b?: number }>({ a: 1 });

	let jsons: string[] = [];
	$run(() => {
		jsons.push(JSON.stringify($state));
	});

	expect(jsons).toEqual(['{"a":1}']);

	$state.b = 2;
	expect(jsons).toEqual(['{"a":1}', '{"a":1,"b":2}']);
});
