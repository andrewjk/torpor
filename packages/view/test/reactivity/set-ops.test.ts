import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $unwrap from "../../src/watch/$unwrap";
import $watch from "../../src/watch/$watch";

test("watched set methods return correct values", () => {
	let set = $watch(new Set(["a", "b"]));
	expect(set).toBeInstanceOf(Set);
	expect(set.has("a")).toBe(true);
	expect(set.size).toBe(2);
	expect([...set.values()]).toEqual(["a", "b"]);
	expect([...set.keys()]).toEqual(["a", "b"]);
	expect([...set]).toEqual(["a", "b"]);
	expect([...set.entries()]).toEqual([
		["a", "a"],
		["b", "b"],
	]);
	expect($unwrap(set)).toBeInstanceOf(Set);
});

test("watched set add/has/delete re-run effects", () => {
	let set = $watch(new Set<string>());
	let runs = 0;
	let has = false;

	$run(() => {
		runs++;
		has = set.has("a");
	});

	expect(runs).toBe(1);
	expect(has).toBe(false);

	set.add("a");
	expect(runs).toBe(2);
	expect(has).toBe(true);

	// Adding an existing element doesn't re-run
	set.add("a");
	expect(runs).toBe(2);

	set.delete("a");
	expect(runs).toBe(3);
	expect(has).toBe(false);

	// An unrelated element doesn't re-run the effect
	set.add("b");
	expect(runs).toBe(3);
});

test("watched set size and iteration re-run effects", () => {
	let set = $watch(new Set(["a", "b"]));
	let runs = 0;
	let count = 0;

	$run(() => {
		runs++;
		count = 0;
		for (const _value of set) {
			count++;
		}
	});

	expect(runs).toBe(1);
	expect(count).toBe(2);

	set.add("c");
	expect(runs).toBe(2);
	expect(count).toBe(3);

	set.delete("c");
	expect(runs).toBe(3);
	expect(count).toBe(2);

	// clear() re-runs size, iteration and per-element readers
	let sizeRuns = 0;
	$run(() => {
		sizeRuns++;
		void set.size;
	});
	expect(sizeRuns).toBe(1);

	set.clear();
	expect(runs).toBe(4);
	expect(sizeRuns).toBe(2);
	expect(set.size).toBe(0);
});

test("watched set object elements are reactive", () => {
	let set = $watch(new Set([{ count: 1 }]));
	let runs = 0;
	let count = 0;

	$run(() => {
		runs++;
		for (const value of set) {
			count = value.count;
		}
	});

	expect(runs).toBe(1);
	expect(count).toBe(1);

	for (const value of set) {
		value.count = 2;
	}
	expect(runs).toBe(2);
	expect(count).toBe(2);

	// Storing a watched object keeps its identity, and has() works with
	// both the proxy and the raw object
	let $obj = $watch({ id: 1 });
	set.add($obj);
	expect(set.has($obj)).toBe(true);
	expect(set.has($unwrap($obj))).toBe(true);
});

test("watched set forEach re-runs effects", () => {
	let set = $watch(new Set([1]));
	let runs = 0;
	let total = 0;

	$run(() => {
		runs++;
		total = 0;
		set.forEach((value) => {
			total += value;
		});
	});

	expect(runs).toBe(1);
	expect(total).toBe(1);

	set.add(2);
	expect(runs).toBe(2);
	expect(total).toBe(3);
});

test("watched collections can be chained", () => {
	let map = $watch(new Map<string, number>());
	expect(map.set("a", 1).set("b", 2).get("b")).toBe(2);

	let set = $watch(new Set<string>());
	expect(set.add("a").add("b").has("b")).toBe(true);
});
