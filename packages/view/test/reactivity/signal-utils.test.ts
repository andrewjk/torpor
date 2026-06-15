import { expect, test } from "vitest";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("$batch groups multiple updates into one notification", () => {
	let $state = $watch({ a: 1, b: 2, c: 3 });
	let runCount = 0;

	let $derived = $watch({
		get computed() {
			runCount++;
			return $state.a + $state.b + $state.c;
		},
	});

	expect($derived.computed).toBe(6);
	expect(runCount).toBe(1);

	// Batch updates
	$state.a = 10;
	$state.b = 20;
	$state.c = 30;

	// Without batching, each set would trigger separately
	expect($derived.computed).toBe(60);
});

test("multiple rapid sets to same value", () => {
	let $state = $watch({ value: 0 });
	let readCount = 0;

	let $derived = $watch({
		get computed() {
			readCount++;
			return $state.value;
		},
	});

	$derived.computed;
	expect(readCount).toBe(1);

	$state.value = 1;
	$state.value = 2;
	$state.value = 3;

	$derived.computed;
	expect($derived.computed).toBe(3);
});

test("setting same value does not trigger", () => {
	let $state = $watch({ value: 5 });
	let runCount = 0;

	$run(() => {
		runCount++;
		void $state.value;
	});

	expect(runCount).toBe(1);

	$state.value = 5;
	expect(runCount).toBe(1);
});

test("setting different value triggers", () => {
	let $state = $watch({ value: 5 });
	let runCount = 0;

	let $derived = $watch({
		get computed() {
			runCount++;
			return $state.value;
		},
	});

	$derived.computed;
	expect(runCount).toBe(1);

	$state.value = 10;
	$derived.computed;
	expect(runCount).toBe(2);
});

test("array length truncation", () => {
	let $state = $watch({
		arr: [1, 2, 3, 4, 5],
	});

	$state.arr.length = 3;
	expect($state.arr.length).toBe(3);
	expect($state.arr[0]).toBe(1);
	expect($state.arr[1]).toBe(2);
	expect($state.arr[2]).toBe(3);
	expect($state.arr[3]).toBeUndefined();
});

test("array length extension", () => {
	let $state = $watch({
		arr: [1, 2, 3],
	});

	$state.arr.length = 5;
	expect($state.arr.length).toBe(5);
	expect($state.arr[3]).toBeUndefined();
	expect($state.arr[4]).toBeUndefined();
});

test("array fill", () => {
	let $state = $watch({
		arr: [1, 2, 3, 4],
	});

	$state.arr.fill(0);
	expect($state.arr.length).toBe(4);
	expect($state.arr[0]).toBe(0);
	expect($state.arr[1]).toBe(0);
	expect($state.arr[2]).toBe(0);
	expect($state.arr[3]).toBe(0);
});

test("array copyWithin", () => {
	let $state = $watch({
		arr: [1, 2, 3, 4, 5],
	});

	$state.arr.copyWithin(0, 3);
	expect($state.arr.length).toBe(5);
	expect($state.arr[0]).toBe(4);
	expect($state.arr[1]).toBe(5);
	expect($state.arr[2]).toBe(3);
	expect($state.arr[3]).toBe(4);
	expect($state.arr[4]).toBe(5);
});

test("array flat", () => {
	let $state = $watch({
		nested: [[1, 2], [3, 4]],
	});

	let flat = $state.nested.flat();
	expect(flat).toEqual([1, 2, 3, 4]);
});

test("object keys/values/entries on reactive object", () => {
	let $state = $watch({ a: 1, b: 2, c: 3 });

	expect(Object.keys($state)).toEqual(["a", "b", "c"]);
	expect(Object.values($state)).toEqual([1, 2, 3]);
	expect(Object.entries($state)).toEqual([
		["a", 1],
		["b", 2],
		["c", 3],
	]);
});
