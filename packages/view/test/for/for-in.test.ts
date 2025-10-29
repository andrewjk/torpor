import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForIn() {
	@render {
		<section>
			@for (let key in $props.item) {
				<p>
					{$props.item[key]}
				</p>
			}
		</section>
	}
}
`;

test("for in -- mounted", async () => {
	let $state = $watch({
		item: {
			first: "1",
			second: "2",
			third: "3",
		},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("for in -- hydrated", async () => {
	let $state = $watch({
		item: {
			first: "1",
			second: "2",
			third: "3",
		},
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "2")).not.toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).toBeNull();
}
