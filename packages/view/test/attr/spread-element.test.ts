import { queryByTestId, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function SpreadElement($props: { items: { attrs: Record<string, any> }[] }) {
	let $state = $watch({
		attrs: {
			"data-one": "1",
			title: "hello",
			disabled: false,
			onclick: () => {
				$state.clicks = $state.clicks + 1;
			},
		} as Record<string, any>,
		clicks: 0,
	})
	@render {
		<div data-testid="target" {...$state.attrs}>
			<p>Content</p>
		</div>
		<span data-testid="clicks">{$state.clicks}</span>
		<button data-testid="swap" onclick={() => { $state.attrs = { "data-two": "2" } }}>
			Swap
		</button>
		<ul>
			@for (let item of $props.items) {
				<li {...item.attrs}>{item.attrs["data-name"]}</li>
			}
		</ul>
	}
}
`;

async function check(container: HTMLElement) {
	const target = queryByTestId(container, "target")!;

	// Spread entries are applied, `false` values are skipped
	expect(target).toHaveAttribute("data-one", "1");
	expect(target).toHaveAttribute("title", "hello");
	expect(target).not.toHaveAttribute("disabled");

	// Spread event listeners work
	const user = userEvent.setup();
	await user.click(target);
	expect(queryByTestId(container, "clicks")).toHaveTextContent("1");

	// Replacing the spread object applies the new entries and removes
	// the dropped ones -- including the event listener
	await user.click(queryByTestId(container, "swap")!);
	expect(target).toHaveAttribute("data-two", "2");
	expect(target).not.toHaveAttribute("data-one");
	expect(target).not.toHaveAttribute("title");
	await user.click(target);
	expect(queryByTestId(container, "clicks")).toHaveTextContent("1");

	// Spread inside a @for loop
	const items = container.querySelectorAll("li");
	expect(items.length).toBe(2);
	expect(items[0]).toHaveAttribute("data-name", "a");
	expect(items[0]).toHaveAttribute("role", "note");
	expect(items[1]).toHaveAttribute("data-name", "b");
	expect(queryByText(container, "a")).not.toBeNull();
}

test("spread element -- mounted", async () => {
	let $state = $watch({
		items: [{ attrs: { "data-name": "a", role: "note" } }, { attrs: { "data-name": "b" } }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	await check(container);

	// Replacing the list re-runs the spread effects with the new items
	$state.items = [{ attrs: { "data-name": "c" } }];
	const items = container.querySelectorAll("li");
	expect(items.length).toBe(1);
	expect(items[0]).toHaveAttribute("data-name", "c");
	expect(items[0]).not.toHaveAttribute("role");
});

test("spread element -- hydrated", async () => {
	let $state = $watch({
		items: [{ attrs: { "data-name": "a", role: "note" } }, { attrs: { "data-name": "b" } }],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	await check(container);
});
