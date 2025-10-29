import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForContainingIf() {
	@render {
		<section>
			@for (let i = 0; i < 5; i++) {
				<button onclick={doit}>do it {i}</button>
				@function doit() {
					// it just needs to exist...
				}
			}
		</section>
	}
}
`;

test("for containing function -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("for containing function -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "do it 0")).not.toBeNull();
	expect(queryByText(container, "do it 1")).not.toBeNull();
	expect(queryByText(container, "do it 2")).not.toBeNull();
	expect(queryByText(container, "do it 3")).not.toBeNull();
	expect(queryByText(container, "do it 4")).not.toBeNull();
	expect(queryByText(container, "do it 5")).toBeNull();
}
