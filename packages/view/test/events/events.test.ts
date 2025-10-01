import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { assert, beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/events/components/Increment";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("events -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("events -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "The count is 0.")).not.toBeNull();

	const increment = Array.from(container.children).find((e) => e.id === "increment");
	assert(increment);
	await userEvent.click(increment);

	expect(queryByText(container, "The count is 1.")).not.toBeNull();

	const increment5 = Array.from(container.children).find((e) => e.id === "increment5");
	assert(increment5);
	await userEvent.click(increment5);

	expect(queryByText(container, "The count is 6.")).not.toBeNull();
}
