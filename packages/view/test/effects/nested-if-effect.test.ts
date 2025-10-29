import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import type ProxyData from "../../src/types/ProxyData";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	condition: boolean;
	counter: number;
}

const source = `
export default function NestedIf($props: { condition: boolean, counter: number }) {
	@render {
		@if ($props.condition) {
			@if ($props.counter > 5) {
				<p>It's big</p>
			} else {
				<p>It's small</p>
			}
		}
	}
}
`;

test("nested if effect -- mounted", async () => {
	let $state = $watch({
		condition: true,
		counter: 0,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("nested if effect -- hydrated", async () => {
	let $state = $watch({
		condition: true,
		counter: 0,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "It's small")).not.toBeNull();

	// `condition`, `counter`
	expect(proxyData(state).signals.size).toBe(2);
	//expect(proxyData(state).signals.get("condition")?.effects?.length).toBe(1);
	//expect(proxyData(state).signals.get("counter")?.effects?.length).toBe(1);
	//expect(Object.keys(proxyData(state).propData).length).toBe(2);

	state.condition = false;

	expect(queryByText(container, "It's small")).toBeNull();

	// `condition`
	expect(proxyData(state).signals.size).toBe(2);
	//expect(proxyData(state).signals.get("condition")?.effects?.length).toBe(1);
	//expect(proxyData(state).signals.get("counter")?.effects?.length).toBe(0);
	//expect(Object.keys(proxyData(state).propData).length).toBe(1);
}

function proxyData(object: any): ProxyData {
	return object[proxyDataSymbol];
}
