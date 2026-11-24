import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

// Regression test: cycle detection used to count every effect run in a flush
// (and throw once a write happened after 100 runs), so a legitimately large
// flush — e.g. a long list whose effects react to the same value — threw
// "Cycle detected" even though nothing was cyclic.
test("a large flush with a state-writing effect does not throw", () => {
	const $state = $watch({ a: 0, out: 0 });

	for (let i = 0; i < 150; i++) {
		$run(() => {
			void $state.a;
		});
	}

	$run(() => {
		$state.out = $state.a * 2;
	});

	expect(() => {
		$state.a = 1;
	}).not.toThrow();

	expect($state.out).toBe(2);
});

test("mutually-triggering effects are detected as a cycle", () => {
	const $state = $watch({ a: 0, b: 0 });

	expect(() => {
		$run(() => {
			$state.b = $state.a + 1;
		});
		$run(() => {
			$state.a = $state.b + 1;
		});
	}).toThrow("Cycle detected");
});
