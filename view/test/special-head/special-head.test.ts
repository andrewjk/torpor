import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/special-head/components/Head";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	level: number;
}

test("special head -- mounted", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special head -- hydrated", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	//console.log(container.textContent);
	//expect(queryByText(container, "Title: Hello")).not.toBeNull();
	expect(container.ownerDocument.title).toBe("Hello");
}
