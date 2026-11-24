import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("RegExp and typed arrays stay opaque", () => {
	const re = /a/;
	const bytes = new Uint8Array([1, 2, 3]);
	const $state = $watch({ re, bytes });

	// The raw objects are returned unchanged, so their methods still work
	expect($state.re).toBe(re);
	expect($state.bytes).toBe(bytes);
	expect($state.re.test("a")).toBe(true);
	expect($state.bytes.subarray(0, 2)).toEqual(new Uint8Array([1, 2]));
	expect(($state.re as any)[proxyDataSymbol]).toBeUndefined();
	expect(($state.bytes as any)[proxyDataSymbol]).toBeUndefined();

	// Explicitly watching one also leaves it unchanged
	expect($watch(re)).toBe(re);
	expect($watch(bytes)).toBe(bytes);
});

test("class instances stay opaque", () => {
	class Counter {
		#count = 0;

		increment() {
			this.#count += 1;
			return this.#count;
		}

		get count() {
			return this.#count;
		}
	}

	const counter = new Counter();
	const $state = $watch({ counter });

	expect($state.counter).toBe(counter);
	expect($state.counter.increment()).toBe(1);
	expect($state.counter.count).toBe(1);
	// A proxied instance would throw on the private-field access above
	expect(($state.counter as any)[proxyDataSymbol]).toBeUndefined();

	// Explicitly watching it doesn't change that
	expect($watch(counter)).toBe(counter);
	expect(counter.increment()).toBe(2);
});

test("array and collection subclasses stay opaque", () => {
	class Rows extends Array<number> {}
	class Counts extends Map<string, number> {}

	const rows = new Rows();
	rows.push(1, 2);
	const counts = new Counts();
	counts.set("a", 1);

	const $state = $watch({ rows, counts });
	expect($state.rows).toBe(rows);
	expect($state.counts).toBe(counts);
	expect($state.counts.get("a")).toBe(1);
	expect(($state.rows as any)[proxyDataSymbol]).toBeUndefined();
	expect(($state.counts as any)[proxyDataSymbol]).toBeUndefined();
});

test("frozen and non-extensible objects stay opaque", () => {
	const frozen = Object.freeze({ value: 1 });
	const sealed = Object.seal({ value: 2 });

	const $state = $watch({ frozen, sealed });

	expect($state.frozen).toBe(frozen);
	expect($state.sealed).toBe(sealed);
	expect(($state.frozen as any)[proxyDataSymbol]).toBeUndefined();
	expect(($state.sealed as any)[proxyDataSymbol]).toBeUndefined();

	// Explicitly watching them doesn't throw
	expect($watch(frozen)).toBe(frozen);
	expect($watch(sealed)).toBe(sealed);
});

test("replacing an opaque value is still reactive", () => {
	const $state = $watch({ re: /a/ });
	let runs = 0;

	$run(() => {
		runs += 1;
		void $state.re.source;
	});

	expect(runs).toBe(1);

	$state.re = /b/;
	expect(runs).toBe(2);
});

test("plain objects, arrays and supported collections are still proxied", () => {
	const $state = $watch({
		obj: {},
		arr: [],
		date: new Date(),
		map: new Map(),
		set: new Set(),
	});

	expect(($state.obj as any)[proxyDataSymbol]).toBeDefined();
	expect(($state.arr as any)[proxyDataSymbol]).toBeDefined();
	expect(($state.date as any)[proxyDataSymbol]).toBeDefined();
	expect(($state.map as any)[proxyDataSymbol]).toBeDefined();
	expect(($state.set as any)[proxyDataSymbol]).toBeDefined();
});
