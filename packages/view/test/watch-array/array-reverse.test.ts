import "@testing-library/jest-dom/vitest";
import { assert, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import ArrayState from "./ArrayState";

const source = `
export default function Array() {
	@render {
		<section>
			<p>^</p>
			@for (let item of $props.items) {
				key = item.id
				<p>
					{item.text}
				</p>
			}
			<p>$</p>
		</section>
	}
}
`;
test("array reverse -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("array reverse -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: ArrayState) {
	assert(container.textContent);

	expect(container.textContent.replace(/\s/g, "")).toBe("^abcd$");

	state.items.reverse();

	expect(container.textContent.replace(/\s/g, "")).toBe("^dcba$");
}
