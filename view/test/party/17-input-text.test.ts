import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/party/components/InputHello";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("input text -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("input text -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const input = container.getElementsByTagName("input")[0];

	expect(queryByText(container, "Hello World")).not.toBeNull();

	await user.clear(input);
	await user.type(input, "Hello Jane");

	expect(queryByText(container, "Hello Jane")).not.toBeNull();
}
