import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/party/components/PickPill";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("input radio -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("input radio -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const blueRadio = container.getElementsByTagName("input")[0];
	const redRadio = container.getElementsByTagName("input")[1];

	expect(queryByText(container, "Picked: red")).not.toBeNull();
	expect(queryByText(container, "Picked: blue")).toBeNull();

	await userEvent.click(blueRadio);

	expect(queryByText(container, "Picked: red")).toBeNull();
	expect(queryByText(container, "Picked: blue")).not.toBeNull();

	await userEvent.click(redRadio);

	expect(queryByText(container, "Picked: red")).not.toBeNull();
	expect(queryByText(container, "Picked: blue")).toBeNull();
}
