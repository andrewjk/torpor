import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/for/components/ForAfterFor";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("for after for -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	check(container);
});

test("for after for -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "0")).not.toBeNull();
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "2")).not.toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).not.toBeNull();
	expect(queryByText(container, "5")).toBeNull();
	expect(queryByText(container, "6")).not.toBeNull();
	expect(queryByText(container, "7")).not.toBeNull();
	expect(queryByText(container, "8")).not.toBeNull();
	expect(queryByText(container, "9")).not.toBeNull();
	expect(queryByText(container, "10")).not.toBeNull();
}
