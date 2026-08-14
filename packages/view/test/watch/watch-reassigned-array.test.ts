import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import $run from "../../src/watch/$run";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("deep-wrap kept on reassigned nested array after a prior read", () => {
	const $state = $watch({ a: [{ messages: [{ id: 1, done: false }] }] });

	// Initial deep read (creates the "0" signal on the array proxy)
	void $state.a[0].messages.length;

	// Reassign the nested array with mapped copies
	$state.a = $state.a.map((c) => ({ ...c, messages: [...c.messages, { id: 2, done: false }] }));

	// The nested array and its elements must still be deep-wrapped
	expect(($state.a[0] as any)[proxyDataSymbol]).toBeDefined();
	expect(($state.a[0].messages as any)[proxyDataSymbol]).toBeDefined();
	expect(($state.a[0].messages[0] as any)[proxyDataSymbol]).toBeDefined();
});

test("in-place mutation of a deep element propagates after reassignment", async () => {
	const $state = $watch({ a: [{ messages: [{ id: 1, done: false }] }] });

	let runs = 0;
	let done: boolean | undefined;
	$run(() => {
		runs++;
		done = ($state.a[0].messages as any).find((m: any) => m.id === 1)?.done;
	});

	expect(runs).toBe(1);
	expect(done).toBe(false);

	$state.a = $state.a.map((c) => ({ ...c, messages: [...c.messages, { id: 2, done: false }] }));

	// In-place mutation of a deep element must propagate to effects
	($state.a[0].messages as any).find((m: any) => m.id === 1)!.done = true;
	await Promise.resolve();

	// 3 runs: initial, reassignment, in-place mutation
	expect(runs).toBe(3);
	expect(done).toBe(true);
});
