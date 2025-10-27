import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/for/components/ForContainingFor";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("for containing for -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	check(container);
});

test("for containing for -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "0-0")).not.toBeNull();
	expect(queryByText(container, "0-1")).not.toBeNull();
	expect(queryByText(container, "1-0")).not.toBeNull();
	expect(queryByText(container, "1-1")).not.toBeNull();
}
