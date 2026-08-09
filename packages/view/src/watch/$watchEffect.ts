import $peek from "./$peek";
import $run from "./$run";
import type Cleanup from "../types/Cleanup";

/**
 * Watches a value derived from reactive state and runs a callback when it
 * changes. The callback is not run on the initial subscription — only on
 * subsequent changes to signals accessed by the getter.
 *
 * Reads inside the callback are untracked and will not cause re-runs.
 *
 * @param getter A function returning the value to watch. Reactive properties
 *   accessed here establish the effect's subscriptions.
 * @param callback A function called with the new (and previous) value whenever
 *   the getter's dependencies change. Not called on the initial run.
 */
export default function $watchEffect<T>(
	getter: () => T,
	callback: (value: T, prevValue: T | undefined) => Cleanup | void,
): void {
	let prevValue: T | undefined;
	let firstRun = true;

	$run(() => {
		const value = getter();
		if (firstRun) {
			firstRun = false;
		} else {
			$peek(() => callback(value, prevValue));
		}
		prevValue = value;
	});
}
