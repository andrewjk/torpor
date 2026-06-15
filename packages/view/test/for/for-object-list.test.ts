import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	fruits: { name: string; color: string }[];
}

const source = `
export default function ForObject($props: { fruits: { name: string; color: string }[] }) {
	@render {
		<ul>
			@for (let fruit of $props.fruits) {
				<li>{fruit.name} is {fruit.color}</li>
			}
		</ul>
	}
}
`;

test("for objects -- mounted", async () => {
	let $state = $watch({
		fruits: [
			{ name: "apple", color: "red" },
			{ name: "banana", color: "yellow" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for objects -- hydrated", async () => {
	let $state = $watch({
		fruits: [
			{ name: "apple", color: "red" },
			{ name: "banana", color: "yellow" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "apple is red")).not.toBeNull();
	expect(queryByText(container, "banana is yellow")).not.toBeNull();

	state.fruits = [{ name: "grape", color: "purple" }];

	expect(queryByText(container, "apple is red")).toBeNull();
	expect(queryByText(container, "banana is yellow")).toBeNull();
	expect(queryByText(container, "grape is purple")).not.toBeNull();
}
