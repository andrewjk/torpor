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
				@if (i > 2) {
					<p>
						{i}
					</p>
				}
			}
		</section>
	}
}
`;

test("for containing if -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("for containing if -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "0")).toBeNull();
	expect(queryByText(container, "1")).toBeNull();
	expect(queryByText(container, "2")).toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "5")).toBeNull();
}
