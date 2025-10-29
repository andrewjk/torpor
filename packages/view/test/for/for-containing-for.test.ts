import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForContainingFor() {
	@render {
		<section>
			@for (let i = 0; i < 5; i++) {
				@for (let j = 0; j < 2; j++) {
					<p>
						{i}-{j}
					</p>
				}
			}
		</section>
	}
}
`;

test("for containing for -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("for containing for -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "0-0")).not.toBeNull();
	expect(queryByText(container, "0-1")).not.toBeNull();
	expect(queryByText(container, "1-0")).not.toBeNull();
	expect(queryByText(container, "1-1")).not.toBeNull();
}
