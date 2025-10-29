import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import type ProxyData from "../../src/types/ProxyData";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function For($props: { items: { text: string }[] }) {
	@render {
		@for (let item of $props.items) {
			<p>{item.text}</p>
		}
	}
}
`;

test("for effect -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for effect -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 0, text: "first" },
			{ id: 1, text: "second" },
			{ id: 2, text: "third" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(_: HTMLElement, state: any) {
	// `items`
	expect(proxyData(state).signals.size).toBe(1);
	//expect(Object.keys(proxyData(state).signals).length).toBe(1);

	// `iterator`, `length`, `0`, `1`, `2`
	expect(proxyData(state.items).signals.size).toBe(4);
	//expect(Object.keys(proxyData(state.items).signals).length).toBe(4);

	// `text`
	expect(proxyData(state.items[0]).signals.size).toBe(1);
	expect(proxyData(state.items[1]).signals.size).toBe(1);
	expect(proxyData(state.items[2]).signals.size).toBe(1);
	//expect(Object.keys(proxyData(state.items[0]).signals).length).toBe(1);
	//expect(Object.keys(proxyData(state.items[1]).signals).length).toBe(1);
	//expect(Object.keys(proxyData(state.items[2]).signals).length).toBe(1);
}

function proxyData(object: any): ProxyData {
	return object[proxyDataSymbol];
}
