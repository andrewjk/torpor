import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $unwrap from "../../src/watch/$unwrap";
import $watch from "../../src/watch/$watch";

test("watched map methods return correct values", () => {
	let map = $watch(
		new Map([
			["a", 1],
			["b", 2],
		]),
	);
	expect(map).toBeInstanceOf(Map);
	expect(map.get("a")).toBe(1);
	expect(map.has("b")).toBe(true);
	expect(map.size).toBe(2);
	expect([...map.keys()]).toEqual(["a", "b"]);
	expect([...map.values()]).toEqual([1, 2]);
	expect([...map.entries()]).toEqual([
		["a", 1],
		["b", 2],
	]);
	expect($unwrap(map)).toBeInstanceOf(Map);
});

test("watched map set/get/delete re-runs effects", () => {
	let map = $watch(new Map<string, number>());
	let runs = 0;
	let value = 0;

	$run(() => {
		runs++;
		value = map.get("a") ?? 0;
	});

	expect(runs).toBe(1);
	expect(value).toBe(0);

	map.set("a", 1);
	expect(runs).toBe(2);
	expect(value).toBe(1);

	map.delete("a");
	expect(runs).toBe(3);
	expect(value).toBe(0);

	// Setting a value on a missing key re-runs...
	map.set("a", 1);
	expect(runs).toBe(4);
	expect(value).toBe(1);

	// ...but setting the same value doesn't
	map.set("a", 1);
	expect(runs).toBe(4);

	// An unrelated key doesn't re-run the effect
	map.set("b", 2);
	expect(runs).toBe(4);

	// ...but a has() on that key re-runs when it's deleted
	let hasRuns = 0;
	$run(() => {
		hasRuns++;
		void map.has("b");
	});
	expect(hasRuns).toBe(1);
	map.delete("b");
	expect(hasRuns).toBe(2);
});

test("watched map size and iteration re-run effects", () => {
	let map = $watch(
		new Map([
			["a", 1],
			["b", 2],
		]),
	);
	let runs = 0;
	let total = 0;

	$run(() => {
		runs++;
		total = 0;
		for (const [key, value] of map) {
			total += key === "a" ? value : 0;
		}
	});

	expect(runs).toBe(1);
	expect(total).toBe(1);

	map.set("a", 10);
	expect(runs).toBe(2);
	expect(total).toBe(10);

	map.set("c", 5);
	expect(runs).toBe(3);

	// clear() re-runs size, iteration and per-key readers
	let sizeRuns = 0;
	$run(() => {
		sizeRuns++;
		void map.size;
	});
	expect(sizeRuns).toBe(1);

	map.clear();
	expect(runs).toBe(4);
	expect(sizeRuns).toBe(2);
	expect(map.size).toBe(0);
});

test("watched map values are reactive objects", () => {
	let map = $watch(new Map([["a", { count: 1 }]]));
	let runs = 0;
	let count = 0;

	$run(() => {
		runs++;
		count = map.get("a")!.count;
	});

	expect(runs).toBe(1);
	expect(count).toBe(1);

	map.get("a")!.count = 2;
	expect(runs).toBe(2);
	expect(count).toBe(2);

	// Repeated reads return the same proxy
	expect(map.get("a")).toBe(map.get("a"));

	// Storing a proxy stores the raw object, so identity is preserved
	let $obj = $watch({ count: 5 });
	map.set("b", $obj);
	expect($unwrap(map.get("b"))).toBe($unwrap($obj));
});

test("watched map forEach re-runs effects", () => {
	let map = $watch(new Map([["a", 1]]));
	let runs = 0;
	let total = 0;

	$run(() => {
		runs++;
		total = 0;
		map.forEach((value) => {
			total += value;
		});
	});

	expect(runs).toBe(1);
	expect(total).toBe(1);

	map.set("b", 2);
	expect(runs).toBe(2);
	expect(total).toBe(3);
});

test("watched map with object keys works", () => {
	let key = { id: 1 };
	let map = $watch(new Map<any, number>());
	let runs = 0;
	let value = 0;

	$run(() => {
		runs++;
		value = map.get(key) ?? 0;
	});

	expect(runs).toBe(1);

	map.set(key, 1);
	expect(runs).toBe(2);
	expect(value).toBe(1);
});
