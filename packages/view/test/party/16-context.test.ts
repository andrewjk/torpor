import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/party/components/UserProfileContextApp";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("context -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("context -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const button = container.getElementsByTagName("button")[0];

	expect(queryByText(container, "Welcome back, unicorn42")).not.toBeNull();
	expect(queryByText(container, "Username: unicorn42")).not.toBeNull();

	await userEvent.click(button);

	expect(queryByText(container, "Welcome back, Jane")).not.toBeNull();
	expect(queryByText(container, "Username: Jane")).not.toBeNull();
}
