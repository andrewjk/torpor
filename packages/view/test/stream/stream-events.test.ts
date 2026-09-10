import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function StreamEvents() {
	let $state = $watch({
		messages: [] as string[],
	});

	$stream((push: (m: string) => void) => {
		const listener = (e: CustomEvent) => push(String(e.detail));
		// @ts-ignore
		document.addEventListener("stream-test", listener);
		// @ts-ignore
		return () => document.removeEventListener("stream-test", listener);
	}, (m) => {
		$state.messages.push(m);
	});

	@render {
		<ul>
			@for (let m of $state.messages) {
				<li>{m}</li>
			}
		</ul>
	}
}
`;

function push(value: string) {
	document.dispatchEvent(new CustomEvent("stream-test", { detail: value }));
}

test("stream -- events update state and render, mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	push("hello");
	push("world");

	expect(queryByText(container, "hello")).not.toBeNull();
	expect(queryByText(container, "world")).not.toBeNull();
});

test("stream -- events update state and render, hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	push("hello");
	push("world");

	expect(queryByText(container, "hello")).not.toBeNull();
	expect(queryByText(container, "world")).not.toBeNull();
});
