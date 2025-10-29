import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	name: string;
}

const source = `
export default function Replace($props: { name: string}) {
	let counter = 0;

	@render {
		@replace ($props.name) {
			<p>The replace count is {counter++}.</p>
		}
	}
}
`;

test("replace -- mounted", async () => {
	let $state = $watch({
		name: "a",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("replace -- hydrated", async () => {
	let $state = $watch({
		name: "a",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: Props) {
	expect(queryByText(container, "The replace count is 0.")).not.toBeNull();

	$state.name = "b";

	expect(queryByText(container, "The replace count is 1.")).not.toBeNull();

	$state.name = "b";

	expect(queryByText(container, "The replace count is 1.")).not.toBeNull();

	$state.name = "c";

	expect(queryByText(container, "The replace count is 2.")).not.toBeNull();
}
