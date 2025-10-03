import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/context/components/Parent";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("context -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	check(container);
});

test("context -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "Parent: hi from the parent")).not.toBeNull();
	expect(queryByText(container, "Child a: hi!")).not.toBeNull();
	expect(queryByText(container, "Child b: ???")).not.toBeNull();
	expect(queryByText(container, "Nothing to see here...")).not.toBeNull();
}
