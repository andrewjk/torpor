import { $run } from "@torpor/view";

/**
 * Runs a function once on subscription and re-runs it whenever any reactive
 * state it read changes. The callback receives a `first` flag that is `true`
 * on the initial run and `false` on every subsequent (change-driven) run, so
 * callers can distinguish setup from "react to a change" without maintaining
 * their own `firstChange` flag.
 *
 * This is a small helper over `$run` kept in @torpor/ui for its components;
 * library authors can copy it if they need the same pattern.
 *
 * @param fn The function to run, receiving a `first` flag. May return a
 *   cleanup function.
 */
export default function $handle(fn: (first: boolean) => void | (() => void)): void {
	let firstRun = true;
	$run(() => {
		const first = firstRun;
		firstRun = false;
		return fn(first);
	});
}
