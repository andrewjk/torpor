import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $await from "../../src/watch/$await";
import $cache from "../../src/watch/$cache";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

test("$await suspends then resolves", async () => {
	let resolvePromise!: (v: string) => void;
	const promise = new Promise<string>((resolve) => {
		resolvePromise = resolve;
	});

	let $state = $watch({
		get data() {
			return $await(() => promise);
		},
	});

	let values: any[] = [];
	$run(() => {
		values.push($state.data);
	});

	// First read: suspended, returns undefined
	expect(values).toEqual([undefined]);

	// Resolve the promise — .then handler propagates, effect re-runs
	resolvePromise("loaded");
	await new Promise((r) => setTimeout(r));

	expect(values).toEqual([undefined, "loaded"]);
});

test("$await resolved value is cached", async () => {
	let computeCount = 0;
	let resolvePromise!: (v: string) => void;
	const promise = new Promise<string>((resolve) => {
		resolvePromise = resolve;
	});

	let $state = $watch({
		get data() {
			computeCount++;
			return $await(() => promise);
		},
	});

	let values: any[] = [];
	$run(() => {
		values.push($state.data);
	});

	expect(values).toEqual([undefined]);

	resolvePromise("cached value");
	await new Promise((r) => setTimeout(r));

	expect(values).toEqual([undefined, "cached value"]);

	// Subsequent reads should return cached value without re-running the getter
	let more: any[] = [];
	$run(() => {
		more.push($state.data);
	});
	expect(more).toEqual(["cached value"]);
	expect(computeCount).toBe(1);
});

test("$await rejects propagate as errors", async () => {
	let rejectPromise!: (e: any) => void;
	const promise = new Promise<string>((_resolve, reject) => {
		rejectPromise = reject;
	});

	let $state = $watch({
		get data() {
			return $await(() => promise);
		},
	});

	let values: any[] = [];
	let errors: any[] = [];
	$run(() => {
		try {
			values.push($state.data);
		} catch (e) {
			errors.push(e);
		}
	});

	expect(values).toEqual([undefined]);

	rejectPromise("boom");
	await new Promise((r) => setTimeout(r));

	// After rejection, reading the computed re-throws the cached error
	expect(errors).toEqual(["boom"]);
});

test("$await ignores stale resolves via generation guard", async () => {
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

	let values: any[] = [];
	$run(() => {
		values.push($state.data);
	});

	expect(values).toEqual([undefined]);

	// Change version — triggers recalc, new promise, new generation
	$state.version = 1;
	await new Promise((r) => setTimeout(r));

	expect(values).toEqual([undefined, undefined]); // re-suspended with new promise

	// Resolve the OLD (stale) promise — should be ignored
	resolveFirst("stale");
	await new Promise((r) => setTimeout(r));

	expect(values).toEqual([undefined, undefined]); // unchanged

	// Resolve the CURRENT promise — should update
	resolveSecond("fresh");
	await new Promise((r) => setTimeout(r));

	expect(values).toEqual([undefined, undefined, "fresh"]);
});

test("$await taint propagates through cache chain", async () => {
	let resolvePromise!: (v: string) => void;
	const promise = new Promise<string>((resolve) => {
		resolvePromise = resolve;
	});

	let $state = $watch({
		get raw() {
			return $await(() => promise);
		},
		get greeting() {
			// $cache reading a suspended $await getter should also suspend
			// (taint propagation) — not cache "Hello, undefined"
			return $cache(() => "Hello, " + $state.raw);
		},
	});

	let greetings: string[] = [];
	$run(() => {
		greetings.push($state.greeting);
	});

	// While raw is suspended, greeting should be undefined (tainted), not "Hello, undefined"
	expect(greetings).toEqual([undefined as any]);

	resolvePromise("World");
	await new Promise((r) => setTimeout(r));

	// After resolve, greeting should have the real value
	expect(greetings).toEqual([undefined, "Hello, World"]);
});

test("$cache throws when it returns a Promise", () => {
	expect(() => {
		let $state = $watch({
			get bad() {
				return $cache(() => Promise.resolve(42));
			},
		});
			void $state.bad;
	}).toThrow("$cache returned a Promise");
});
