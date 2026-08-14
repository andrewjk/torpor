import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $async from "../../src/watch/$async";
import $pending from "../../src/watch/$pending";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";
import runComputed from "../../src/watch/runComputed";
import { proxyDataSymbol } from "../../src/watch/symbols";
import type Computed from "../../src/types/Computed";

test("$pending returns true while awaiting, false after resolve", async () => {
	let resolvePromise!: (v: string) => void;
	const promise = new Promise<string>((resolve) => {
		resolvePromise = resolve;
	});

	let $state = $watch({
		get data() {
			return $async(() => promise);
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
			return $async(() => promise);
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
			return $async(() =>
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

test("$pending: first load is loud, dependency-change refresh is loud", async () => {
	// Regression guard for the quiet-on-refresh semantics: both the first
	// load and a refresh triggered by a tracked dependency change must read
	// as pending (ASYNC.md §7.4).
	let resolveFirst!: (v: string) => void;
	let resolveSecond!: (v: string) => void;

	let $state = $watch({
		version: 0,
		get data() {
			return $async(() =>
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

	let pending: boolean[] = [];
	$run(() => {
		pending.push($pending(() => $state.data));
	});

	// First load: loud
	expect(pending).toEqual([true]);
	const data = ($state as any)[proxyDataSymbol];
	const computed = data.signals.get("data") as Computed;
	expect(computed.hasResolved).toBe(false);
	expect(computed.suspendQuiet).toBe(false);

	resolveFirst("first");
	await new Promise((r) => setTimeout(r));
	expect(pending).toEqual([true, false]);
	expect(computed.hasResolved).toBe(true);

	// Dependency change → refresh: loud
	$state.version = 1;
	await new Promise((r) => setTimeout(r));
	expect(pending).toEqual([true, false, true]);
	expect(computed.hasResolved).toBe(true);
	expect(computed.suspendQuiet).toBe(false);

	resolveSecond("second");
	await new Promise((r) => setTimeout(r));
	expect(pending).toEqual([true, false, true, false]);
});

test("$pending is quiet on a bare refresh (no dependency change)", async () => {
	// A bare refresh — re-fetching without a tracked dependency change —
	// must be quiet: $pending returns false even though the computed is
	// suspended. Torpor has no `refresh()` primitive yet, so this simulates
	// one by re-running the computed directly (recalc === false,
	// hasResolved === true → suspendQuiet === true), exactly what a future
	// refresh() would do.
	let resolveFirst!: (v: string) => void;
	let resolveBare!: (v: string) => void;
	let call = 0;

	let $state = $watch({
		get data() {
			return $async(() =>
				++call === 1
					? new Promise<string>((r) => {
							resolveFirst = r;
						})
					: new Promise<string>((r) => {
							resolveBare = r;
						}),
			);
		},
	});

	// First load is loud
	expect($pending(() => $state.data)).toBe(true);

	resolveFirst("first");
	await new Promise((r) => setTimeout(r));
	expect($pending(() => $state.data)).toBe(false);

	const data = ($state as any)[proxyDataSymbol];
	const computed = data.signals.get("data") as Computed;
	expect(computed.hasResolved).toBe(true);

	// Simulate a bare refresh: re-run the computed with no source change.
	runComputed(computed);

	// Suspended, but quiet
	expect(computed.didSuspend).toBe(true);
	expect(computed.suspendQuiet).toBe(true);
	expect($pending(() => $state.data)).toBe(false);

	// Resolving the quiet refresh stays quiet (no pending)
	resolveBare("bare");
	await new Promise((r) => setTimeout(r));
	expect(computed.didSuspend).toBe(false);
	expect($pending(() => $state.data)).toBe(false);
});

test("$pending: a loud refresh after a quiet one reads as pending", async () => {
	// After a quiet (bare) refresh, a subsequent dependency-change refresh
	// must be loud again — suspendQuiet is recomputed on every run.
	let resolveFirst!: (v: string) => void;
	let resolveBare!: (v: string) => void;
	let resolveLoud!: (v: string) => void;
	let call = 0;

	let $state = $watch({
		version: 0,
		get data() {
			return $async(() => {
				// Read version so a real dependency change re-runs this;
				// the bare refresh below bypasses that path by calling
				// runComputed directly (recalc stays false).
				void $state.version;
				++call;
				if (call === 1) {
					return new Promise<string>((r) => {
						resolveFirst = r;
					});
				}
				if (call === 2) {
					return new Promise<string>((r) => {
						resolveBare = r;
					});
				}
				return new Promise<string>((r) => {
					resolveLoud = r;
				});
			});
		},
	});

	let pending: boolean[] = [];
	$run(() => {
		pending.push($pending(() => $state.data));
	});

	expect(pending).toEqual([true]);

	resolveFirst("first");
	await new Promise((r) => setTimeout(r));
	expect(pending).toEqual([true, false]);

	const data = ($state as any)[proxyDataSymbol];
	const computed = data.signals.get("data") as Computed;

	// Bare refresh → quiet (no reactive notification, so the effect doesn't
	// re-run on its own; $pending only reports quiet if asked directly)
	runComputed(computed);
	expect(computed.suspendQuiet).toBe(true);
	expect($pending(() => $state.data)).toBe(false);

	resolveBare("bare");
	await new Promise((r) => setTimeout(r));
	// The bare refresh's resolve propagates and re-runs the effect, which
	// reports false (nothing pending). The bare refresh *start* did not
	// re-run the effect — that's the quiet part.
	expect(pending).toEqual([true, false, false]);

	// Now a real dependency-change refresh → loud
	$state.version = 1;
	await new Promise((r) => setTimeout(r));
	expect(computed.suspendQuiet).toBe(false);
	expect(pending).toEqual([true, false, false, true]);

	resolveLoud("loud");
	await new Promise((r) => setTimeout(r));
	expect(pending).toEqual([true, false, false, true, false]);
});
