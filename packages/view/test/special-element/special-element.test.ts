import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/special-element/components/Element";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	tag: string;
}

test("special element -- mounted", async () => {
	let $state = $watch({
		tag: "h4",
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special element -- hydrated", async () => {
	let $state = $watch({
		tag: "h4",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")?.tagName).toBe("H4");

	$state.tag = "p";

	expect(queryByText(container, "Hello!")?.tagName).toBe("P");
}
