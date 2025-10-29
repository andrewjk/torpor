import "@testing-library/jest-dom/vitest";
import { assert, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

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
test("array empty -- mounted", async () => {
	let $state = $watch({
		items: [],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("array empty -- hydrated", async () => {
	let $state = $watch({
		items: [],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});

function check(container: HTMLElement) {
	assert(container.textContent);

	expect(container.textContent.replace(/\s/g, "")).toBe("^$");
}
