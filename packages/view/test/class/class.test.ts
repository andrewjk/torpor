import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/class/components/Class";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	red: boolean;
	green: boolean;
	blue: boolean;
}

test("class -- mounted", async () => {
	let $state = $watch({
		red: true,
		green: false,
		blue: true,
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("class -- hydrated", async () => {
	let $state = $watch({
		red: true,
		green: false,
		blue: true,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveClass("hello red blue", { exact: true });

	expect(queryByText(container, "Class object")).not.toBeNull();
	expect(queryByText(container, "Class object")).toHaveClass("foo baz", { exact: true });

	expect(queryByText(container, "Class array")).not.toBeNull();
	expect(queryByText(container, "Class array")).toHaveClass("foo baz", { exact: true });

	expect(queryByText(container, "Class nested")).not.toBeNull();
	expect(queryByText(container, "Class nested")).toHaveClass("foo bar baz qux", { exact: true });

	// Change state
	state.green = true;
	state.blue = false;

	expect(queryByText(container, "Hello!")).toHaveClass("hello red green", { exact: true });
}
