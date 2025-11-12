import "@testing-library/jest-dom/vitest";
import { assert, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	text?: string;
}

const source = `
export default function Watched() {
	@render {
		<p>
			{$props.text}
		</p>
	}
}
`;

test("watch undefined property change -- mounted", async () => {
	let $state = $watch({});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("watch undefined property change -- hydrated", async () => {
	let $state = $watch({});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	assert(container.textContent);

	expect(container.textContent.replace(/\s+/g, " ").trim()).toBe("");

	state.text = "hello";

	expect(container.textContent.replace(/\s+/g, " ").trim()).toBe("hello");
}
