import { queryByTestId, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/for/components/ForEscape";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("for escape -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("for escape -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
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
