import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function StreamResubscribe() {
	let $state = $watch({
		channel: "a",
		messages: [] as string[],
	});

	$stream((push: (m: string) => void) => {
		// Reading $state.channel inside the source tracks it: a change
		// unsubscribes the old listener and subscribes the new one. Capture
		// the value in a local, so the cleanup removes the listener it
		// actually added (not whatever the value is at teardown time)
		const channel = $state.channel;
		const listener = (e: CustomEvent) => push(String(e.detail));
		// @ts-ignore
		document.addEventListener(channel, listener);
		// @ts-ignore
		return () => document.removeEventListener(channel, listener);
	}, (m) => {
		$state.messages.push(m);
	});

	@render {
		<button onclick={() => { $state.channel = "b" }}>Switch</button>
		<ul>
			@for (let m of $state.messages) {
				<li>{m}</li>
			}
		</ul>
	}
}
`;

function push(channel: string, value: string) {
	document.dispatchEvent(new CustomEvent(channel, { detail: value }));
}

function clickSwitch(container: HTMLElement) {
	(container.getElementsByTagName("button")[0] as HTMLButtonElement).click();
}

test("stream -- resubscribes when tracked state changes, mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	push("a", "before");
	expect(queryByText(container, "before")).not.toBeNull();

	clickSwitch(container);

	// The old channel is unsubscribed, the new one is live
	push("a", "stale");
	expect(queryByText(container, "stale")).toBeNull();

	push("b", "after");
	expect(queryByText(container, "after")).not.toBeNull();
});

test("stream -- resubscribes when tracked state changes, hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	push("a", "before");
	expect(queryByText(container, "before")).not.toBeNull();

	clickSwitch(container);

	push("a", "stale");
	expect(queryByText(container, "stale")).toBeNull();

	push("b", "after");
	expect(queryByText(container, "after")).not.toBeNull();
});
