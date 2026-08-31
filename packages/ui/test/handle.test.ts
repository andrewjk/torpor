import { $watch } from "@torpor/view";
import { expect, test } from "vite-plus/test";
import $handle from "../src/utils/$handle";

test("$handle runs immediately with first=true", () => {
	let $state = $watch({ count: 1 });
	const calls: boolean[] = [];

	$handle((first) => {
		calls.push(first);
		void $state.count;
	});

	expect(calls).toEqual([true]);
});

test("$handle re-runs when a dependency changes with first=false", () => {
	let $state = $watch({ count: 1 });
	const calls: boolean[] = [];

	$handle((first) => {
		calls.push(first);
		void $state.count;
	});

	$state.count = 2;

	expect(calls).toEqual([true, false]);
});

test("$handle reacts to multiple sources", () => {
	let $state = $watch({ a: 1, b: 2 });
	let seen = 0;

	$handle((first) => {
		if (!first) seen++;
		void $state.a;
		void $state.b;
	});

	$state.a = 10;
	expect(seen).toBe(1);

	$state.b = 20;
	expect(seen).toBe(2);
});

test("$handle cleanup runs before each re-run", () => {
	let $state = $watch({ count: 1 });
	const log: string[] = [];

	$handle((first) => {
		log.push(first ? "run" : "rerun");
		void $state.count;
		return () => {
			log.push("cleanup");
		};
	});

	$state.count = 2;

	expect(log).toEqual(["run", "cleanup", "rerun"]);
});

test("$handle does not re-run when a non-dependency changes", () => {
	let $state = $watch({ dep: 1, other: 1 });
	let runs = 0;

	$handle(() => {
		runs++;
		void $state.dep;
	});

	$state.other = 2;

	expect(runs).toBe(1);
});

test("$handle skips re-run when setting the same value", () => {
	let $state = $watch({ count: 1 });
	let runs = 0;

	$handle(() => {
		runs++;
		void $state.count;
	});

	$state.count = 1;

	expect(runs).toBe(1);
});
