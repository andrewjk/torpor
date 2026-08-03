import { bench } from "vitest";
import clearRegion from "../../src/render/clearRegion";
import context from "../../src/render/context";
import newRegion from "../../src/render/newRegion";
import type Region from "../../src/types/Region";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

// Micro-benchmark for the stale-subscription cleanup fix in `releaseRegion`.
//
// Mirrors the js-framework-bench `selected` fanout pattern: many effects (one
// per row) subscribed to one popular signal, then the list is cleared. The
// next time the popular signal fires, only ACTIVE subscriptions should walk —
// not the cleared ones. Before the fix, every cleared row's subscription
// stayed in `signal.firstTarget` forever and was re-walked + re-run on every
// subsequent change.

const N = 1000;

function setup() {
	const $state = $watch({ selected: null as number | null });
	const region: Region = newRegion("bench-region");
	region.depth = 1;

	const oldActiveRegion = context.activeRegion;
	const oldPreviousRegion = context.previousRegion;
	context.activeRegion = region;
	context.previousRegion = region;

	let runs = 0;
	for (let i = 0; i < N; i++) {
		$run(() => {
			runs++;
			void $state.selected;
		});
	}

	context.activeRegion = oldActiveRegion;
	context.previousRegion = oldPreviousRegion;

	return { $state, region, runs };
}

// Sanity: the clear path itself, with the per-effect source-list detach
// walking all N subscriptions. This is the new cost we pay at clear time —
// paid back on the next signal change (see the next bench).
bench(
	"clear 1k subscribed-effect region (with detach)",
	() => {
		const { region } = setup();
		clearRegion(region);
	},
	{ iterations: 50, warmupIterations: 10 },
);

// The actual payoff: after clearing N effects subscribed to a popular
// signal, mutating that signal should be O(1) — walk only the (zero) active
// subscriptions — instead of O(N) where N is the cumulative count of every
// effect ever created and cleared against this signal.
bench(
	"selected mutation after 1k cleared effects (steady state)",
	() => {
		// Each iteration creates a fresh state, clears, then mutates.
		const { $state, region } = setup();
		clearRegion(region);
		// Mutate after clear — before the fix this would re-walk + re-run
		// every cleared effect.
		$state.selected = 1;
		$state.selected = null;
		$state.selected = 2;
	},
	{ iterations: 50, warmupIterations: 10 },
);

// Repeat-clear steady state: 10 rounds of create-1k-then-clear against the
// SAME signal, with a final mutation. Before the fix the final mutation
// re-walked 10k stale subscriptions; after the fix it walks zero.
bench(
	"selected mutation after 10 rounds of 1k create+clear",
	() => {
		const $state = $watch({ selected: null as number | null });
		for (let round = 0; round < 10; round++) {
			const region: Region = newRegion(`round-${round}`);
			region.depth = 1;
			const oldActive = context.activeRegion;
			const oldPrev = context.previousRegion;
			context.activeRegion = region;
			context.previousRegion = region;
			for (let i = 0; i < N; i++) {
				$run(() => {
					void $state.selected;
				});
			}
			context.activeRegion = oldActive;
			context.previousRegion = oldPrev;
			clearRegion(region);
		}
		// Now mutate — this is where the leak used to compound.
		$state.selected = 1;
	},
	{ iterations: 10, warmupIterations: 2 },
);
