import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	show: boolean;
	items: string[];
}

const source = `
export default function IfContainingFor($props: { show: boolean; items: string[] }) {
	@render {
		@if ($props.show) {
			<ul>
				@for (let item of $props.items) {
					<li>{item}</li>
				}
			</ul>
		} else {
			<p>Nothing to show</p>
		}
	}
}
`;

test("if containing for -- mounted", async () => {
	let $state = $watch({ show: true, items: ["alpha", "beta"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("if containing for -- hydrated", async () => {
	let $state = $watch({ show: true, items: ["alpha", "beta"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "alpha")).not.toBeNull();
	expect(queryByText(container, "beta")).not.toBeNull();
	expect(queryByText(container, "Nothing to show")).toBeNull();

	state.show = false;
	expect(queryByText(container, "alpha")).toBeNull();
	expect(queryByText(container, "beta")).toBeNull();
	expect(queryByText(container, "Nothing to show")).not.toBeNull();

	state.items = ["gamma", "delta", "epsilon"];
	state.show = true;
	expect(queryByText(container, "gamma")).not.toBeNull();
	expect(queryByText(container, "delta")).not.toBeNull();
	expect(queryByText(container, "epsilon")).not.toBeNull();
}
