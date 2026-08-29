import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForRegex($props: { items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li
					data-testid={item}
					data-starts-a={/^a/.test(item) ? "" : undefined}
					data-label={item.replace(/\\b[a-z]/g, (c) => c.toUpperCase())}
				>
					{item.replace(/\\d+/g, "")}
				</li>
			}
		</ul>
	}
}
`;

function check(container: HTMLElement) {
	expect(queryByTestId(container, "apple")).toHaveAttribute("data-starts-a", "");
	expect(queryByTestId(container, "apple")).toHaveAttribute("data-label", "Apple");
	expect(queryByTestId(container, "banana")).not.toHaveAttribute("data-starts-a");
	expect(queryByTestId(container, "banana")).toHaveAttribute("data-label", "Banana");
	expect(queryByTestId(container, "b2")).toHaveTextContent("b");
}

test("for regex literals in expressions -- mounted", async () => {
	let $state = $watch({ items: ["apple", "banana", "b2"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("for regex literals in expressions -- hydrated", async () => {
	let $state = $watch({ items: ["apple", "banana", "b2"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});
