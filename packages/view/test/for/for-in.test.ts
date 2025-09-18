import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/for/components/ForIn";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("for in -- mounted", async () => {
	let $state = $watch({
		item: {
			first: "1",
			second: "2",
			third: "3",
		},
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container);
});

test("for in -- hydrated", async () => {
	let $state = $watch({
		item: {
			first: "1",
			second: "2",
			third: "3",
		},
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "1")).not.toBeNull();
	expect(queryByText(container, "2")).not.toBeNull();
	expect(queryByText(container, "3")).not.toBeNull();
	expect(queryByText(container, "4")).toBeNull();
}
