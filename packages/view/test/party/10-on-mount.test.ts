import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/party/components/PageTitle";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("on mount -- mounted", async () => {
	document.title = "Document Title";

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	check(container);
});

test("on mount -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "Page title: Document Title")).not.toBeNull();
}
