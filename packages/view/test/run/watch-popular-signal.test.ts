import { expect, test } from "vite-plus/test";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

// Regression test for the popular-signal fanout pattern: many effects
// subscribing to the same signal must remain correct (and remain O(N) —
// the previous trackSignal walked signal.firstTarget to find existing
// subscriptions, which was O(N) per call / O(N²) total).
//
// Each effect reads the shared `selected` signal plus its own per-item
// property, mirroring the js-framework-bench row template.

test("many effects subscribed to one signal all update when it changes", () => {
	const $state = $watch({
		selected: null as number | null,
		items: Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, label: `item ${i + 1}` })),
	});

	// Subscribe 1000 effects, each reading the shared `selected` signal
	const labels = Array.from({ length: 1000 }).fill("") as string[];
	for (let i = 0; i < 1000; i++) {
		const idx = i;
		const item = $state.items[i]!;
		$run(() => {
			// Read shared signal (subscription fanout) and per-item data
			const isSelected = $state.selected === item.id;
			labels[idx] = isSelected ? `SELECTED ${item.id}` : `item ${item.id}`;
		});
	}

	expect(labels[0]).toBe("item 1");
	expect(labels[42]).toBe("item 43");

	// Change the shared signal — all 1000 effects should re-run
	$state.selected = 43;
	expect(labels[42]).toBe("SELECTED 43");
	expect(labels[0]).toBe("item 1");

	$state.selected = 1;
	expect(labels[0]).toBe("SELECTED 1");
	expect(labels[42]).toBe("item 43");

	$state.selected = null;
	expect(labels[0]).toBe("item 1");
	expect(labels[42]).toBe("item 43");
});

test("effect that re-subscribes to the same popular signal stays subscribed", () => {
	const $state = $watch({
		branch: 0 as number,
		shared: "a" as string,
	});

	// Two conditional branches — when branch changes, the effect depends
	// on `shared` in either case. Verify the subscription isn't dropped
	// during the re-subscription.
	const log: string[] = [];
	$run(() => {
		// Always read `shared`, regardless of branch
		const s = $state.shared;
		if ($state.branch === 0) {
			log.push(`branch0:${s}`);
		} else {
			log.push(`branch1:${s}`);
		}
	});

	expect(log).toEqual(["branch0:a"]);

	$state.shared = "b";
	expect(log).toEqual(["branch0:a", "branch0:b"]);

	$state.branch = 1;
	expect(log).toEqual(["branch0:a", "branch0:b", "branch1:b"]);

	// Critical: after switching branches, `shared` must still trigger updates
	$state.shared = "c";
	expect(log).toEqual(["branch0:a", "branch0:b", "branch1:b", "branch1:c"]);
});
