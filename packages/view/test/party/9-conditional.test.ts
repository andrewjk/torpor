import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/party/components/TrafficLight";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("conditional -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("conditional -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "STOP")).not.toBeNull();
	expect(queryByText(container, "SLOW DOWN")).toBeNull();
	expect(queryByText(container, "GO")).toBeNull();

	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "STOP")).toBeNull();
	expect(queryByText(container, "SLOW DOWN")).not.toBeNull();
	expect(queryByText(container, "GO")).toBeNull();

	await userEvent.click(button);

	expect(queryByText(container, "STOP")).toBeNull();
	expect(queryByText(container, "SLOW DOWN")).toBeNull();
	expect(queryByText(container, "GO")).not.toBeNull();
}
