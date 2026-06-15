import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	choice: string;
	items: string[];
}

const source = `
export default function ForInSwitch($props: { choice: string; items: string[] }) {
	@render {
		@switch ($props.choice) {
			case "list": {
				<ul>
					@for (let item of $props.items) {
						<li>{item}</li>
					}
				</ul>
			}
			case "count": {
				<p>Count: {$props.items.length}</p>
			}
			default: {
				<p>Nothing</p>
			}
		}
	}
}
`;

test("for in switch -- mounted", async () => {
	let $state = $watch({ choice: "list", items: ["alpha", "beta", "gamma"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for in switch -- hydrated", async () => {
	let $state = $watch({ choice: "list", items: ["alpha", "beta", "gamma"] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "alpha")).not.toBeNull();
	expect(queryByText(container, "beta")).not.toBeNull();
	expect(queryByText(container, "gamma")).not.toBeNull();
	expect(queryByText(container, "Nothing")).toBeNull();

	state.choice = "count";
	expect(queryByText(container, "alpha")).toBeNull();
	expect(queryByText(container, "Count: 3")).not.toBeNull();

	state.items = ["x", "y"];
	expect(queryByText(container, "Count: 2")).not.toBeNull();

	state.choice = "unknown";
	expect(queryByText(container, "Count: 2")).toBeNull();
	expect(queryByText(container, "Nothing")).not.toBeNull();

	state.choice = "list";
	expect(queryByText(container, "x")).not.toBeNull();
	expect(queryByText(container, "y")).not.toBeNull();
	expect(queryByText(container, "Nothing")).toBeNull();
}
