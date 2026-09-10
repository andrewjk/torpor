import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForComment($props: { items: string[] }) {
	let $state = $watch({ selected: "" })
	@render {
		<ul>
			@for (let [index, item] of $props.items.entries()) {
				<li>
					<button
						data-testid={item}
						data-selected={$state.selected === item ? "" : undefined}
						onclick={(e: MouseEvent) => {
							// The field doesn't blur first, so mousedown it is
							e.preventDefault();
							$state.selected = item;
						}}
					>
						{index}: {item}
					</button>
				</li>
			}
		</ul>
	}
}
`;

test("for comment in handler -- mounted", async () => {
	let $state = $watch({ items: ["a", "b"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const user = userEvent.setup();
	await user.click(queryByTestId(container, "b")!);

	expect(queryByTestId(container, "b")).toHaveAttribute("data-selected", "");
	expect(queryByTestId(container, "a")).not.toHaveAttribute("data-selected");
});

test("for comment in handler -- hydrated", async () => {
	let $state = $watch({ items: ["a", "b"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByTestId(container, "b")).toBeInTheDocument();
	expect(queryByTestId(container, "b")).toHaveTextContent("1: b");
});
