import "@testing-library/jest-dom/vitest";
import { assert, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import ArrayState from "./ArrayState";

const source = `
export default function ArrayIndexes() {
	@render {
		<section>
			<p>^</p>
			@for (let i = 0; i < $props.items.length; i++) {
				key = $props.items[i].id
				<span>
					{i > 0 ? ", " : ""}
					{$props.items[i].text}
				</span>
			}
			<p>$</p>
		</section>
	}
}
`;

test("array indexes -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("array indexes -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
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

	// TODO: Should have spaces between letter items
	expect(container.textContent.replace(/\s/g, "")).toBe("^b,a,d,c$");

	state.items.sort((a, b) => a.text.localeCompare(b.text));

	expect(container.textContent.replace(/\s/g, "")).toBe("^a,b,c,d$");

	state.items[1].text = "e";

	expect(container.textContent.replace(/\s/g, "")).toBe("^a,e,c,d$");
}
