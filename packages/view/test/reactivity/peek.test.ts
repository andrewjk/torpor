import { expect, test } from "vite-plus/test";
import $cache from "../../src/watch/$cache";
import $peek from "../../src/watch/$peek";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("$peek reads value without creating a dependency", () => {
	let $state = $watch({ a: 1, b: 10 });
	let runs = 0;

	$run(() => {
		runs++;
		let b = $peek(() => $state.b);
		// Access $state.a to create a dependency
		void $state.a;
		void b;
	});

	expect(runs).toBe(1);

	// Changing b should NOT trigger a re-run since we peeked
	$state.b = 20;
	expect(runs).toBe(1);

	// Changing a SHOULD trigger a re-run
	$state.a = 2;
	expect(runs).toBe(2);
});

test("$peek returns the value", () => {
	let $state = $watch({ value: 42 });

	let result = $peek(() => $state.value);

	expect(result).toBe(42);
});

test("$peek in $cache prevents dependency tracking", () => {
	let $state = $watch({ tracked: 1, untracked: 100 });
	let computeCount = 0;

	let $derived = $watch({
		get computed() {
			return $cache(() => {
				computeCount++;
				return $state.tracked + $peek(() => $state.untracked);
			});
		},
	});

	expect($derived.computed).toBe(101);
	expect(computeCount).toBe(1);

	// Changing untracked should NOT recompute
	$state.untracked = 200;
	expect($derived.computed).toBe(101);
	expect(computeCount).toBe(1);

	// Changing tracked SHOULD recompute
	$state.tracked = 5;
	expect($derived.computed).toBe(205);
	expect(computeCount).toBe(2);
});

test("$peek with nested access", () => {
	let $state = $watch({ obj: { deep: { value: "hello" } } });

	let result = $peek(() => $state.obj.deep.value);

	expect(result).toBe("hello");
});

test("$peek can be called outside of reactive context", () => {
	let $state = $watch({ value: "test" });

	let result = $peek(() => $state.value);

	expect(result).toBe("test");
});
