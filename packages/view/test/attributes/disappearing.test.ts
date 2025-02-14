import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/attributes/components/Attributes";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	thing: any;
	dataThing: any;
}

test("attributes disappearing -- mounted", async () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("attributes disappearing -- hydrated", async () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveAttribute("thing", "thing1");
	expect(queryByText(container, "Hello!")).toHaveAttribute("data-thing", "thing2");

	state.thing = false;
	state.dataThing = false;

	expect(queryByText(container, "Hello!")).not.toHaveAttribute("thing", "thing1");
	expect(queryByText(container, "Hello!")).not.toHaveAttribute("data-thing", "thing2");

	state.thing = "back";
	state.dataThing = "again";

	expect(queryByText(container, "Hello!")).toHaveAttribute("thing", "back");
	expect(queryByText(container, "Hello!")).toHaveAttribute("data-thing", "again");

	state.thing = null;
	state.dataThing = undefined;

	expect(queryByText(container, "Hello!")).not.toHaveAttribute("thing");
	expect(queryByText(container, "Hello!")).not.toHaveAttribute("data-thing");
}
