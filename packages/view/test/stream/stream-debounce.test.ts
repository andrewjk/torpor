import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test, vi } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import unmount from "../../src/render/unmount";

const source = `
export default function StreamDebounce() {
	let $state = $watch({
		last: "none",
	});

	$stream((push: (m: string) => void) => {
		const listener = (e: CustomEvent) => push(String(e.detail));
		// @ts-ignore
		document.addEventListener("stream-test", listener);
		// @ts-ignore
		return () => document.removeEventListener("stream-test", listener);
	}, (m) => {
		(window as any).__streamLog.push(m);
		$state.last = m;
	}, { debounce: 100 });

	@render {
		<p>Last: {$state.last}</p>
	}
}
`;

function push(value: string) {
	document.dispatchEvent(new CustomEvent("stream-test", { detail: value }));
}

afterEach(() => {
	vi.useRealTimers();
});

test("stream -- debounce only handles the last event in a burst", async () => {
	vi.useFakeTimers();
	(window as any).__streamLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	push("a");
	push("b");
	push("c");

	// Nothing handled while events keep coming
	expect((window as any).__streamLog).toEqual([]);
	expect(queryByText(container, "Last: none")).not.toBeNull();

	vi.advanceTimersByTime(50);
	push("d");

	vi.advanceTimersByTime(100);

	// Only the last event of the burst is handled
	expect((window as any).__streamLog).toEqual(["d"]);
	expect(queryByText(container, "Last: d")).not.toBeNull();
});

test("stream -- unmount drops a pending debounced call", async () => {
	vi.useFakeTimers();
	(window as any).__streamLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	push("a");
	unmount(container);

	vi.advanceTimersByTime(500);

	// The subscription was torn down before the debounce elapsed
	expect((window as any).__streamLog).toEqual([]);
});

test("stream -- debounce hydrates", async () => {
	vi.useFakeTimers();
	(window as any).__streamLog = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	push("a");

	vi.advanceTimersByTime(100);

	expect((window as any).__streamLog).toEqual(["a"]);
	expect(queryByText(container, "Last: a")).not.toBeNull();
});
