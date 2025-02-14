import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/party/components/ColorSelect";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("input select -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("input select -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const select = container.getElementsByTagName("select")[0];

	expect(queryByText(container, "Selected: blue")).not.toBeNull();

	await user.selectOptions(select, "1");

	expect(queryByText(container, "Selected: red")).not.toBeNull();

	await user.selectOptions(select, "3");

	expect(queryByText(container, "Selected: green")).not.toBeNull();

	// This shouldn't work because the option is disabled
	await user.selectOptions(select, "4");

	expect(queryByText(container, "Selected: gray")).toBeNull();
	expect(queryByText(container, "Selected: green")).not.toBeNull();
}
