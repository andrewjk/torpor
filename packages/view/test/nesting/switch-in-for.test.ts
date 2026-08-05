import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	items: { name: string; type: string }[];
}

const source = `
export default function SwitchInFor($props: { items: { name: string; type: string }[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>
					@switch (item.type) {
						case "admin": {
							<strong>{item.name} (admin)</strong>
						}
						case "user": {
							<span>{item.name} (user)</span>
						}
						default: {
							<em>{item.name} (unknown)</em>
						}
					}
				</li>
			}
		</ul>
	}
}
`;

test("switch in for -- mounted", async () => {
	let $state = $watch({
		items: [
			{ name: "Alice", type: "admin" },
			{ name: "Bob", type: "user" },
			{ name: "Eve", type: "guest" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("switch in for -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ name: "Alice", type: "admin" },
			{ name: "Bob", type: "user" },
			{ name: "Eve", type: "guest" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const alice = container.querySelector("strong");
	expect(alice).not.toBeNull();
	expect(alice).toHaveTextContent("Alice (admin)");

	const bob = container.querySelector("span");
	expect(bob).not.toBeNull();
	expect(bob).toHaveTextContent("Bob (user)");

	const eve = container.querySelector("em");
	expect(eve).not.toBeNull();
	expect(eve).toHaveTextContent("Eve (unknown)");

	state.items = [
		{ name: "Dave", type: "user" },
		{ name: "Grace", type: "admin" },
	];

	const dave = container.querySelectorAll("span");
	expect(dave.length).toBeGreaterThanOrEqual(1);

	const strongs = container.querySelectorAll("strong");
	expect(strongs.length).toBeGreaterThanOrEqual(1);
	expect(strongs[0]).toHaveTextContent("Grace (admin)");
}
