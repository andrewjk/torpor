import { queryByTestId, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForEscape() {
	let things = ["a", "b", "c", "d", "e"]
	@render {
		<section>
			@for (let i = 0; i < 5; i++) {
				<p>{i}</p>
				<div data-testid="input1-{i}" name={i} />
				<div data-testid="input2-{i}" name="{i}" />
				<div data-testid="input3-{i}" name={things[i]} />
				<input &value={i} name="{i}" />
			}
		</section>
	}
}
`;

test("for escape -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("for escape -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByTestId(container, "input1-2")).not.toBeNull();
	expect(queryByTestId(container, "input1-2")).toHaveAttribute("name", "2");

	expect(queryByTestId(container, "input2-2")).not.toBeNull();
	expect(queryByTestId(container, "input2-2")).toHaveAttribute("name", "2");

	expect(queryByTestId(container, "input3-2")).not.toBeNull();
	expect(queryByTestId(container, "input3-2")).toHaveAttribute("name", "c");

	const input = container.getElementsByTagName("input")[0];

	await userEvent.clear(input);
	await userEvent.type(input, "Hello");

	expect(queryByText(container, "Hello")).not.toBeNull();
}
