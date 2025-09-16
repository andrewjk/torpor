import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/attributes/components/Attributes";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

interface State {
	thing: any;
	dataThing: any;
	description: string;
}

test("attributes -- mounted", async () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
		description: "a person",
		attr: "val",
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("attributes -- hydrated", async () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
		description: "a person",
		attr: "val",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, _: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveAttribute("thing", "thing1");
	expect(queryByText(container, "Hello!")).toHaveAttribute("data-thing", "thing2");
	expect(queryByText(container, "Hello!")).toHaveAttribute(
		"caption",
		"this attribute is for a person",
	);
	expect(queryByText(container, "Hello!")).toHaveAttribute("attr", "val");
}
