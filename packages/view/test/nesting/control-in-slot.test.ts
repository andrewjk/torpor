import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	items: { name: string; visible: boolean }[];
}

const source = `
export default function ControlInSlot($props: { items: { name: string; visible: boolean }[] }) {
	@render {
		<Card>
			@for (let item of $props.items) {
				@if (item.visible) {
					<p>{item.name}</p>
				}
			}
		</Card>
	}
}

function Card() {
	@render {
		<div class="card">
			<h2>Card title</h2>
			<slot />
		</div>
	}
}
`;

test("control flow in slot -- mounted", async () => {
	let $state = $watch({
		items: [
			{ name: "Alpha", visible: true },
			{ name: "Beta", visible: false },
			{ name: "Gamma", visible: true },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("control flow in slot -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ name: "Alpha", visible: true },
			{ name: "Beta", visible: false },
			{ name: "Gamma", visible: true },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Card title")).not.toBeNull();
	expect(queryByText(container, "Alpha")).not.toBeNull();
	expect(queryByText(container, "Beta")).toBeNull();
	expect(queryByText(container, "Gamma")).not.toBeNull();

	state.items = [
		{ name: "Alpha", visible: false },
		{ name: "Beta", visible: true },
		{ name: "Gamma", visible: false },
	];

	expect(queryByText(container, "Alpha")).toBeNull();
	expect(queryByText(container, "Beta")).not.toBeNull();
	expect(queryByText(container, "Gamma")).toBeNull();
}
