import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $async from "../../src/watch/$async";
import $cache from "../../src/watch/$cache";
import $pending from "../../src/watch/$pending";
import $refresh from "../../src/watch/$refresh";
import $run from "../../src/watch/$run";
import $watch from "../../src/watch/$watch";

const tick = () => new Promise((r) => setTimeout(r));

test("$refresh re-runs the $async thunk and updates on resolve", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	let values: any[] = [];
	$run(() => {
		values.push($state.data);
	});

	// First load suspends
	expect(values).toEqual([undefined]);

	resolvers[0]("first");
	await tick();
	expect(values).toEqual([undefined, "first"]);

	// Refresh re-fetches without touching any dependency. Loud by default, so
	// subscribers re-run at suspend start and re-read the retained stale value.
	$refresh(() => $state.data);
	expect(call).toBe(2);
	expect(values).toEqual([undefined, "first", "first"]);

	resolvers[1]("second");
	await tick();
	expect(values).toEqual([undefined, "first", "first", "second"]);
});

test("$refresh works from outside any effect (event-handler style)", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	let values: any[] = [];
	$run(() => {
		values.push($state.data);
	});

	resolvers[0]("first");
	await tick();

	// No active target: still collects and re-runs the computed. The loud
	// refresh notifies the subscribed effect, which re-reads the stale value.
	$refresh(() => $state.data);
	expect(call).toBe(2);
	expect(values).toEqual([undefined, "first", "first"]);

	resolvers[1]("second");
	await tick();
	expect(values).toEqual([undefined, "first", "first", "second"]);
});

test("$refresh with silent:true is quiet — $pending stays false", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	// First load is loud
	expect($pending(() => $state.data)).toBe(true);
	resolvers[0]("first");
	await tick();
	expect($pending(() => $state.data)).toBe(false);

	// A silent refresh (background revalidation) is quiet — no notification at
	// start, and $pending reads false while the re-fetch is in flight.
	$refresh(() => $state.data, { silent: true });
	expect(call).toBe(2);
	expect($pending(() => $state.data)).toBe(false);

	// Resolving the silent refresh stays quiet
	resolvers[1]("second");
	await tick();
	expect($pending(() => $state.data)).toBe(false);
});

test("$refresh with silent:true doesn't re-run subscribers at refresh start", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	let values: any[] = [];
	$run(() => {
		values.push($state.data);
	});

	resolvers[0]("first");
	await tick();
	expect(values).toEqual([undefined, "first"]);

	// A silent refresh notifies nothing until resolve — no intermediate stale
	// re-read, unlike the loud default.
	$refresh(() => $state.data, { silent: true });
	expect(values).toEqual([undefined, "first"]);

	resolvers[1]("second");
	await tick();
	expect(values).toEqual([undefined, "first", "second"]);
});

test("$refresh keeps showing the stale value while the new fetch is in flight", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	$run(() => {
		void $state.data;
	});

	resolvers[0]("first");
	await tick();
	expect($state.data).toBe("first");

	// During the refresh suspend, readers get the previous value
	$refresh(() => $state.data);
	expect($state.data).toBe("first");

	resolvers[1]("second");
	await tick();
	expect($state.data).toBe("second");
});

test("$refresh re-fetches a computed whose first load is still pending (retry first load)", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	// The UI read the getter; its first load is still pending when the
	// refresh happens
	$run(() => {
		void $state.data;
	});
	expect(call).toBe(1);

	$refresh(() => $state.data);
	expect(call).toBe(2);

	// A never-resolved computed reads as loud even during a refresh
	expect($pending(() => $state.data)).toBe(true);

	// Stale resolve from the abandoned first fetch is ignored
	resolvers[0]("stale");
	await tick();
	expect($state.data).not.toBe("stale");

	resolvers[1]("fresh");
	await tick();
	expect($state.data).toBe("fresh");
});

test("$refresh on a never-read getter fetches once (no double fetch)", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	// No UI read has ever touched the getter — the first-ever read happens
	// inside $refresh's collection, which initializes it and starts the
	// fetch. That fetch IS the refresh: no second one may start (its resolve
	// would be dropped by the generation guard).
	$refresh(() => $state.data);
	expect(call).toBe(1);

	// First loads are loud, so $pending still reads true while in flight
	expect($pending(() => $state.data)).toBe(true);

	resolvers[0]("fresh");
	await tick();
	expect($state.data).toBe("fresh");
	expect($pending(() => $state.data)).toBe(false);
});

test("$refresh on a never-read getter is single-fetch even when silent", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	$refresh(() => $state.data, { silent: true });
	expect(call).toBe(1);

	// A first load is loud regardless of silent (hasResolved is false)
	expect($pending(() => $state.data)).toBe(true);

	resolvers[0]("fresh");
	await tick();
	expect($state.data).toBe("fresh");
});

test("$refresh re-fetches a never-read getter after it resolves", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	// Initialize via $refresh (single fetch), resolve
	$refresh(() => $state.data);
	resolvers[0]("first");
	await tick();
	expect($state.data).toBe("first");

	// A later $refresh reads an already-initialized getter: the collection
	// is a pure peek and the refresh re-runs it normally
	$refresh(() => $state.data);
	expect(call).toBe(2);

	resolvers[1]("second");
	await tick();
	expect($state.data).toBe("second");
});

test("$refresh recovers after an error (retry-after-error)", async () => {
	let call = 0;

	let $state = $watch({
		get data() {
			return $async(() => {
				if (++call === 1) return Promise.reject(new Error("boom"));
				return Promise.resolve("recovered");
			});
		},
	});

	let values: any[] = [];
	let errors: any[] = [];
	$run(() => {
		try {
			values.push($state.data);
		} catch (e) {
			errors.push((e as Error).message);
		}
	});

	expect(values).toEqual([undefined]);
	await tick();
	expect(errors).toEqual(["boom"]);

	// Retry the failed fetch (loud by default). The error is NOT retained as
	// stale content (lastErrored), so the retry suspend reads as a plain
	// undefined while the fresh promise is in flight.
	$refresh(() => $state.data);
	expect(values).toEqual([undefined, undefined]);

	await tick();

	expect(values).toEqual([undefined, undefined, "recovered"]);
	expect(errors).toEqual(["boom"]);
});

test("$refresh re-fetches every $async getter read by fn", async () => {
	let calls = { a: 0, b: 0 };
	let resolversA: ((v: string) => void)[] = [];
	let resolversB: ((v: string) => void)[] = [];

	let $state = $watch({
		get a() {
			return $async(() => {
				calls.a++;
				return new Promise<string>((resolve) => {
					resolversA.push(resolve);
				});
			});
		},
		get b() {
			return $async(() => {
				calls.b++;
				return new Promise<string>((resolve) => {
					resolversB.push(resolve);
				});
			});
		},
	});

	$run(() => {
		void $state.a;
		void $state.b;
	});
	resolversA[0]("a1");
	resolversB[0]("b1");
	await tick();
	expect(calls).toEqual({ a: 1, b: 1 });

	$refresh(() => {
		void $state.a;
		void $state.b;
	});
	expect(calls).toEqual({ a: 2, b: 2 });

	resolversA[1]("a2");
	resolversB[1]("b2");
	await tick();
	expect($state.a).toBe("a2");
	expect($state.b).toBe("b2");
});

test("$refresh ignores $cache computeds", () => {
	let cacheCalls = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get sync() {
			return $cache(() => ++cacheCalls);
		},
		get data() {
			return $async(() => {
				return new Promise<string>((resolve) => {
					resolvers.push(resolve);
				});
			});
		},
	});

	$run(() => {
		void $state.sync;
		void $state.data;
	});
	expect(cacheCalls).toBe(1);

	$refresh(() => {
		void $state.sync;
		void $state.data;
	});

	// The $async computed was re-run (new fetch queued); the $cache getter was
	// not re-computed.
	expect(cacheCalls).toBe(1);
	expect(resolvers).toHaveLength(2);
});

test("$refresh with no $async getters is a no-op", () => {
	let $state = $watch({
		value: 42,
	});

	let result: number | undefined;
	$run(() => {
		result = $state.value;
	});

	expect(() => $refresh(() => $state.value)).not.toThrow();
	expect(result).toBe(42);
});

test("$refresh is loud by default — $pending flips true at refresh start", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	let pendingValues: boolean[] = [];
	$run(() => {
		pendingValues.push($pending(() => $state.data));
	});

	// First load loud
	expect(pendingValues).toEqual([true]);
	resolvers[0]("first");
	await tick();
	expect(pendingValues).toEqual([true, false]);

	// A loud refresh notifies subscribers at suspend *start*, so the pending
	// indicator flips on immediately — the spinner can appear.
	$refresh(() => $state.data);
	expect(pendingValues).toEqual([true, false, true]);

	resolvers[1]("second");
	await tick();
	expect(pendingValues).toEqual([true, false, true, false]);
});

test("$refresh is loud by default — keeps showing the stale value (no flicker)", async () => {
	let call = 0;
	let resolvers: ((v: string) => void)[] = [];

	let $state = $watch({
		get data() {
			return $async(() => {
				const i = call++;
				return new Promise<string>((resolve) => {
					resolvers[i] = resolve;
				});
			});
		},
	});

	let values: any[] = [];
	$run(() => {
		values.push($state.data);
	});

	resolvers[0]("first");
	await tick();
	expect(values).toEqual([undefined, "first"]);

	// Loud refresh: subscribers re-run at start, but reads still return the
	// retained stale value — no placeholder, no undefined flash.
	$refresh(() => $state.data);
	expect(values).toEqual([undefined, "first", "first"]);

	resolvers[1]("second");
	await tick();
	expect(values).toEqual([undefined, "first", "first", "second"]);
});
