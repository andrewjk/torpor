import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/for/components/ForContainingFunction";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("for containing function -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	check(container);
});

test("for containing function -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "do it 0")).not.toBeNull();
	expect(queryByText(container, "do it 1")).not.toBeNull();
	expect(queryByText(container, "do it 2")).not.toBeNull();
	expect(queryByText(container, "do it 3")).not.toBeNull();
	expect(queryByText(container, "do it 4")).not.toBeNull();
	expect(queryByText(container, "do it 5")).toBeNull();
}
