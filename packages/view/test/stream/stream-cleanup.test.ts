import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import unmount from "../../src/render/unmount";

const source = `
export default function StreamCleanup() {
	let $state = $watch({
		last: "",
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
	});

	@render {
		<p>Last: {$state.last}</p>
	}
}
`;

function push(value: string) {
	document.dispatchEvent(new CustomEvent("stream-test", { detail: value }));
}

test("stream -- unmount unsubscribes the source", async () => {
	(window as any).__streamLog = [];

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	push("a");
	expect((window as any).__streamLog).toEqual(["a"]);

	unmount(container);

	push("b");
	expect((window as any).__streamLog).toEqual(["a"]);
});

test("stream -- region clear unsubscribes the source (hydrated)", async () => {
	(window as any).__streamLog = [];

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	push("a");
	expect((window as any).__streamLog).toEqual(["a"]);

	unmount(container);

	push("b");
	expect((window as any).__streamLog).toEqual(["a"]);
});
