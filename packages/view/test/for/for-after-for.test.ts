import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForAfterFor() {
	@render {
		<section>
			@for (let i = 0; i < 5; i++) {
				<p>
					{i}
				</p>
			}
			@for (let i = 10; i > 5; i--) {
				<p>
					{i}
				</p>
			}
		</section>
	}
}
`;

test("for after for -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("for after for -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "0")).not.toBeNull();
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "2")).not.toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "5")).toBeNull();
	expect(queryByText(container, "6")).not.toBeNull();
	expect(queryByText(container, "7")).not.toBeNull();
	expect(queryByText(container, "8")).not.toBeNull();
	expect(queryByText(container, "9")).not.toBeNull();
	expect(queryByText(container, "10")).not.toBeNull();
}
