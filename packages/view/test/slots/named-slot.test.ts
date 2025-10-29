import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Named() {
	@render {
		<Article>
			<fill name="header">
				The article's header
			</fill>
			<p>
				The article's body
			</p>
		</Article>
	}
}

function Article() {
	@render {
		<section>
			<h2>
				<slot name="header" />
			</h2>
			<slot />
			<slot name="footer" />
		</section>
	}
}
`;

test("named slot -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("named slot -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "The article's header")).not.toBeNull();
	expect(queryByText(container, "The article's body")).not.toBeNull();
}
