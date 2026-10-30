import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrate from "../../src/render/hydrate";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// An empty `@for` inside a component slot. Growing it after mount must work
// both for a plain mount and while hydrating a server render that had no rows
// (e.g. data seeded in `$onmount`). The hydration case once made the row
// create walk past the list's anchor into a null node.
const source = `
export default function App($props: { items: string[] }) {
	@render {
		<Wrapper>
			@if ($props.items.length === 0) {
				<p class="empty">Empty</p>
			}
			@for (let item of $props.items) {
				@key = item
				<li>{item}</li>
			}
		</Wrapper>
	}
}

function Wrapper() {
	@render {
		<div class="wrapper">
			<slot />
			<p class="after">After</p>
		</div>
	}
}
`;

function items(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent ?? "");
}

async function hydrateWith(
	serverState: { items: string[] },
	clientState: { items: string[] },
): Promise<HTMLElement> {
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body } = await serverComponent(serverState);

	const container = document.createElement("div");
	container.innerHTML = body;
	container.ownerDocument.body.appendChild(container);
	hydrate(container, clientComponent, clientState);
	return container;
}

test("for empty inside slot -- grows after mount", async () => {
	const $state = $watch({ items: [] as string[] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Empty")).not.toBeNull();
	expect(items(container)).toEqual([]);

	$state.items = ["hello"];
	expect(queryByText(container, "Empty")).toBeNull();
	expect(items(container)).toEqual(["hello"]);

	$state.items = ["hello", "world"];
	expect(items(container)).toEqual(["hello", "world"]);

	$state.items = [];
	expect(items(container)).toEqual([]);
	expect(queryByText(container, "Empty")).not.toBeNull();
});

test("for empty inside slot -- hydrates rows the server did not render", async () => {
	const container = await hydrateWith(
		$watch({ items: [] as string[] }),
		$watch({ items: ["hello"] as string[] }),
	);

	expect(queryByText(container, "Empty")).toBeNull();
	expect(items(container)).toEqual(["hello"]);
	expect(container.querySelector(".wrapper")).not.toBeNull();
	expect(queryByText(container, "After")).not.toBeNull();
});
