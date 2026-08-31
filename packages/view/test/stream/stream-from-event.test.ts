import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function StreamFromEvent() {
	let saveButton: HTMLButtonElement;

	let $state = $watch({
		count: 0,
	});

	$stream(fromElement(() => saveButton, "click"), () => {
		$state.count++;
	});

	@render {
		<button &ref={saveButton}>Save</button>
		<p>Count: {$state.count}</p>
	}
}
`;

function click(container: HTMLElement) {
	const button = container.getElementsByTagName("button")[0];
	(button as HTMLButtonElement).click();
}

test("stream -- fromElement with &ref, mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	click(container);
	click(container);
	click(container);

	expect(queryByText(container, "Count: 3")).not.toBeNull();
});

test("stream -- fromElement with &ref, hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	click(container);

	expect(queryByText(container, "Count: 1")).not.toBeNull();
});
