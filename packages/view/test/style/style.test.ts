import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/style/components/Style";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	color: string;
}

test("style -- mounted", async () => {
	let $state = $watch({
		color: "#aaa",
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("style -- hydrated", async () => {
	let $state = $watch({
		color: "#aaa",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveStyle({ color: "#aaa" });

	// Change state
	state.color = "#bbb";

	expect(queryByText(container, "Hello!")).toHaveStyle({ color: "#bbb" });
}
