import { expect, test } from "vite-plus/test";
import clearRegion from "../../src/render/clearRegion";
import context from "../../src/render/context";
import newRegion from "../../src/render/newRegion";
import type Region from "../../src/types/Region";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";

// Regression test for stale-subscription cleanup when a region is released.
//
// When a region that owns effects is cleared (e.g. an `@if` toggling false, or
// a `@for` list shrinking), the effects' source subscriptions must be detached
// from their signals' target lists. Otherwise the destroyed effects stay in
// `signal.firstTarget` forever, get re-queued on every change to that signal,
// and re-run uselessly against detached DOM nodes — a memory leak and a
// growing per-change cost in long-lived apps.
//
// We exercise this by setting up an effect inside a region (mirroring the
// shape the compiler emits for `@if`/`@for`), clearing the region, then
// mutating the signal the effect subscribed to. With correct cleanup the
// effect must NOT re-run.

test("destroyed region's effects are unsubscribed from their signals", () => {
	const $state = $watch({ selected: null as number | null });

	// Read the proxyData via the symbol so we can inspect the signal's target
	// list directly without going through the proxy's `get` trap (which would
	// otherwise try to track the access against whatever effect is active).
	const data = ($state as any)[proxyDataSymbol];

	// Build a region manually — same shape the compiler emits around effects
	// owned by `@if`/`@for`. startNode/endNode are left null; clearRegion
	// handles that case (skips DOM removal but still releases the region and
	// runs effect cleanups).
	const region: Region = newRegion("test");
	region.depth = 1;

	// Install it as the active region so $run attaches its effect to our
	// region's `effects` array. Save/restore so other tests are unaffected.
	const oldActiveRegion = context.activeRegion;
	const oldPreviousRegion = context.previousRegion;
	context.activeRegion = region;
	context.previousRegion = region;

	let runCount = 0;
	try {
		$run(() => {
			runCount++;
			// Read `selected` so the effect subscribes to it
			void $state.selected;
		});
	} finally {
		context.activeRegion = oldActiveRegion;
		context.previousRegion = oldPreviousRegion;
	}

	expect(runCount).toBe(1);

	// The signal should now have one target (our effect)
	const signalBefore = data.signals.get("selected");
	expect(signalBefore).toBeDefined();
	expect(signalBefore.firstTarget).not.toBeNull();

	// Clear the region — must detach all effect source subscriptions so the
	// destroyed effect is not re-queued on future signal changes.
	clearRegion(region);

	// The signal's target list must now be empty
	expect(signalBefore.firstTarget).toBeNull();

	// Mutating `selected` must NOT re-run the destroyed effect
	$state.selected = 5;
	expect(runCount).toBe(1);
});

test("destroyed region's effects do not fire on subsequent signal changes", () => {
	// Same shape as above, but with many effects on a popular signal (mirrors
	// the js-framework-bench pattern where every row effect reads the parent's
	// `$state.selected`). After clear, none of them should re-run.
	const $state = $watch({ selected: null as number | null });
	const data = ($state as any)[proxyDataSymbol];

	const region: Region = newRegion("test-many");
	region.depth = 1;

	const oldActiveRegion = context.activeRegion;
	const oldPreviousRegion = context.previousRegion;
	context.activeRegion = region;
	context.previousRegion = region;

	let totalRuns = 0;
	const COUNT = 1000;
	try {
		for (let i = 0; i < COUNT; i++) {
			$run(() => {
				totalRuns++;
				void $state.selected;
			});
		}
	} finally {
		context.activeRegion = oldActiveRegion;
		context.previousRegion = oldPreviousRegion;
	}

	expect(totalRuns).toBe(COUNT);

	const signalBefore = data.signals.get("selected");
	expect(signalBefore.firstTarget).not.toBeNull();

	clearRegion(region);

	expect(signalBefore.firstTarget).toBeNull();

	$state.selected = 7;
	$state.selected = 99;
	$state.selected = null;

	// No destroyed effect should have re-run
	expect(totalRuns).toBe(COUNT);
});
