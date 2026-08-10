import $run from "./$run";
import type Cleanup from "../types/Cleanup";

/**
 * Runs a function once on subscription and re-runs it whenever any reactive
 * state it read changes. The callback receives a `first` flag that is `true`
 * on the initial run and `false` on every subsequent (change-driven) run, so
 * callers can distinguish setup from "react to a change" without maintaining
 * their own `firstChange` flag.
 *
 * Behaves like `$run` (every reactive read inside the body establishes a
 * subscription, so you can react to multiple sources naturally) — the only
 * addition is the `first` argument.
 *
 * @param fn The function to run, receiving a `first` flag. May return a
 *   cleanup function.
 */
export default function $handle(fn: (first: boolean) => Cleanup | void): void {
	let firstRun = true;
	$run(() => {
		const first = firstRun;
		firstRun = false;
		return fn(first);
	});
}
