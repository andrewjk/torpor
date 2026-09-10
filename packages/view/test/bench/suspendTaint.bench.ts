import { bench, describe } from "vite-plus/test";
import $async from "../../src/watch/$async";
import $cache from "../../src/watch/$cache";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

/**
 * The §7.8 taint-propagation question, made repeatable: every read of a
 * suspended `Computed` flips `didSuspend` on the active reader up the cache
 * chain — O(depth) per read. These benches time one effect re-run (via a
 * trigger signal) that reads the top of a $cache chain over a $async base,
 * at several depths, suspended vs resolved. The measured result: the taint
 * flips are unmeasurable against the normal reactive read (which is itself
 * O(depth)) — ~900-1000ns per run at every depth, suspended or not.
 */
describe("suspend taint propagation", () => {
	for (const depth of [1, 10, 50, 100]) {
		for (const suspended of [false, true]) {
			const $state: any = $watch({
				trigger: 0,
				get base() {
					return $async(() => (suspended ? new Promise(() => {}) : Promise.resolve("value")));
				},
			});
			for (let i = 0; i < depth; i++) {
				const prev = i === 0 ? "base" : `level${i - 1}`;
				Object.defineProperty($state, `level${i}`, {
					get() {
						return $cache(() => "" + $state[prev]);
					},
					configurable: true,
				});
			}
			const top = `level${depth - 1}`;

			$run(() => {
				void $state.trigger;
				void $state[top];
			});

			bench(`depth ${String(depth).padStart(3)} ${suspended ? "suspended" : "resolved"}`, () => {
				$state.trigger++;
			});
		}
	}
});
