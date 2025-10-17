import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/html/components/Html";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	html: string;
}

test("html -- mounted", async () => {
	let $state = $watch({
		html: "<strong><em>I'm strong and emphasised</em></strong>",
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("html -- hydrated", async () => {
	let $state = $watch({
		html: "<strong><em>I'm strong and emphasised</em></strong>",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "I'm strong and emphasised")).not.toBeNull();
	expect(queryByText(container, "I'm strong and emphasised")?.outerHTML).toBe(
		"<em>I'm strong and emphasised</em>",
	);

	$state.html = "<ul><li>A list</li></ul>";

	expect(queryByText(container, "A list")).not.toBeNull();
}
