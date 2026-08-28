import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForOptionalChaining($props: {
	items: { name: string; hasChildren?: boolean }[]
}) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li
					data-testid={item?.name}
					data-selected={item?.hasChildren === true ? "" : undefined}
					data-fallback={"x" ?? item?.name}
				>
					{item?.name}
				</li>
			}
		</ul>
	}
}
`;

function items(container: HTMLElement): { name: string | null; selected: string | null }[] {
	return [...container.querySelectorAll("li")].map((li) => ({
		name: li.getAttribute("data-testid"),
		selected: li.getAttribute("data-selected"),
	}));
}

test("for optional chaining -- mounted", async () => {
	let $state = $watch({
		items: [{ name: "one", hasChildren: true }, { name: "two" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(items(container)).toEqual([
		{ name: "one", selected: "" },
		{ name: "two", selected: null },
	]);

	$state.items = [{ name: "three", hasChildren: true }];
	expect(items(container)).toEqual([{ name: "three", selected: "" }]);
});

test("for optional chaining -- hydrated", async () => {
	let $state = $watch({ items: [{ name: "one" }, { name: "two", hasChildren: true }] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(items(container)).toEqual([
		{ name: "one", selected: null },
		{ name: "two", selected: "" },
	]);
});
