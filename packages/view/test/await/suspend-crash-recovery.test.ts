import { expect, test } from "vite-plus/test";
import $async from "../../src/watch/$async";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("effect crashing on a first-load suspend re-runs when the promise resolves", async () => {
	let resolvePromise!: (v: string) => void;
	const promise = new Promise<string>((resolve) => {
		resolvePromise = resolve;
	});

	let $state = $watch({
		flag: false,
		get data() {
			return $async(() => promise);
		},
	});

	let values: number[] = [];
	// First run: flag is false, the getter is never read — succeeds
	$run(() => {
		if ($state.flag) {
			// Crashes on the pending read's undefined (the DataGrid shape:
			// using the value as if it were data)
			values.push($state.data.length);
		}
	});
	expect(values).toEqual([]);

	// Flip the flag: the re-run reads the still-pending getter, the body
	// crashes on undefined, and the error surfaces (no error boundary)
	let flushError: any = null;
	try {
		$state.flag = true;
	} catch (err) {
		flushError = err;
	}
	expect(flushError).toBeInstanceOf(TypeError);
	expect(values).toEqual([]);

	// Resolve: the effect re-runs with the real value and succeeds, instead
	// of staying dead because the crash detached its resolve subscription
	resolvePromise("hello");
	await new Promise((r) => setTimeout(r));
	expect(values).toEqual([5]);
});

test("effect crashing on a rejected read does not re-subscribe", async () => {
	let rejectPromise!: (e: any) => void;
	const promise = new Promise<string>((_resolve, reject) => {
		rejectPromise = reject;
	});

	let $state = $watch({
		flag: false,
		get data() {
			return $async(() => promise);
		},
	});

	// Prime the computed with a plain read, then reject
	expect($state.data).toBeUndefined();
	rejectPromise("boom");
	await new Promise((r) => setTimeout(r));

	let values: number[] = [];
	$run(() => {
		if ($state.flag) {
			values.push($state.data.length);
		}
	});
	expect(values).toEqual([]);

	// The re-run reads the computed and the cached rejection re-throws —
	// a real error, not a pending read, so the effect is not re-subscribed
	let flushError: any = null;
	try {
		$state.flag = true;
	} catch (err) {
		flushError = err;
	}
	expect(flushError).toBe("boom");
	expect(values).toEqual([]);

	// Nothing heals it: no further runs happen
	await new Promise((r) => setTimeout(r));
	expect(values).toEqual([]);
});
