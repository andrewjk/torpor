import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $await from "../../src/watch/$await";
import $pending from "../../src/watch/$pending";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("$pending returns true while awaiting, false after resolve", async () => {
	let resolvePromise!: (v: string) => void;
	const promise = new Promise<string>((resolve) => {
		resolvePromise = resolve;
	});

	let $state = $watch({
		get data() {
			return $await(() => promise);
		},
	});

	let pendingValues: boolean[] = [];
	$run(() => {
		pendingValues.push($pending(() => $state.data));
	});

	// First read: data is suspended → pending is true
	expect(pendingValues).toEqual([true]);

	resolvePromise("loaded");
	await new Promise((r) => setTimeout(r));

	// After resolve: data is available → pending is false
	expect(pendingValues).toEqual([true, false]);
});

test("$pending returns false for non-suspended values", () => {
	let $state = $watch({
		value: 42,
	});

	let result = false;
	$run(() => {
		result = $pending(() => $state.value);
	});

	expect(result).toBe(false);
});

test("$pending doesn't cause the calling effect to suspend", () => {
	let _resolvePromise!: (v: string) => void;
	const promise = new Promise<string>((resolve) => {
		_resolvePromise = resolve;
	});

	let $state = $watch({
		get data() {
			return $await(() => promise);
		},
	});

	// If $pending caused the effect to suspend, this effect would have
	// didSuspend = true and the value wouldn't be usable
	let values: any[] = [];
	$run(() => {
		const isPending = $pending(() => $state.data);
		values.push(isPending);
	});

	// The effect ran and produced a value — it didn't suspend
	expect(values).toEqual([true]);
});

test("$pending re-evaluates on re-suspend", async () => {
	let resolveFirst!: (v: string) => void;
	let resolveSecond!: (v: string) => void;

	let $state = $watch({
		version: 0,
		get data() {
			return $await(
				() =>
					$state.version === 0
						? new Promise<string>((r) => {
								resolveFirst = r;
							})
						: new Promise<string>((r) => {
								resolveSecond = r;
							}),
			);
		},
	});

	let pendingValues: boolean[] = [];
	$run(() => {
		pendingValues.push($pending(() => $state.data));
	});

	expect(pendingValues).toEqual([true]);

	resolveFirst("first");
	await new Promise((r) => setTimeout(r));
	expect(pendingValues).toEqual([true, false]);

	// Trigger re-fetch
	$state.version = 1;
	await new Promise((r) => setTimeout(r));
	expect(pendingValues).toEqual([true, false, true]);

	resolveSecond("second");
	await new Promise((r) => setTimeout(r));
	expect(pendingValues).toEqual([true, false, true, false]);
});
