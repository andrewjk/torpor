import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("`in` re-runs an effect when the key is added", () => {
	const $state = $watch<{ k?: number }>({});
	let present = false;
	let runs = 0;

	$run(() => {
		runs++;
		present = "k" in $state;
	});

	expect(present).toBe(false);
	expect(runs).toBe(1);

	$state.k = 1;

	expect(present).toBe(true);
	expect(runs).toBe(2);

	// Changing an existing key doesn't change membership
	$state.k = 2;
	expect(runs).toBe(2);
});

test("`in` re-runs an effect when the key is deleted", () => {
	const $state = $watch<{ k?: number }>({ k: 1 });
	let present = true;
	let runs = 0;

	$run(() => {
		runs++;
		present = "k" in $state;
	});

	expect(present).toBe(true);

	delete $state.k;

	expect(present).toBe(false);
	expect(runs).toBe(2);
});

test("`in` still reports inherited properties", () => {
	const $state = $watch({ a: 1 });
	expect("toString" in $state).toBe(true);
	expect("missing" in $state).toBe(false);
});
