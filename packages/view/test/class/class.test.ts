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
	expect(queryByText(container, "From string")).not.toBeNull();
	expect(queryByText(container, "From string")).toHaveClass("yo torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "From state")).not.toBeNull();
	expect(queryByText(container, "From state")).toHaveClass("hello red blue torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "From state with scope")).not.toBeNull();
	expect(queryByText(container, "From state with scope")).toHaveClass(
		"hello red blue torp-1ljxz83",
		{
			exact: true,
		},
	);

	expect(queryByText(container, "Class object")).not.toBeNull();
	expect(queryByText(container, "Class object")).toHaveClass("foo baz torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "Class array")).not.toBeNull();
	expect(queryByText(container, "Class array")).toHaveClass("foo baz torp-1ljxz83", {
		exact: true,
	});

	expect(queryByText(container, "Class nested")).not.toBeNull();
	expect(queryByText(container, "Class nested")).toHaveClass("foo bar baz qux torp-1ljxz83", {
		exact: true,
	});

	// Change state
	state.green = true;
	state.blue = false;

	expect(queryByText(container, "From state")).toHaveClass("hello red green torp-1ljxz83", {
		exact: true,
	});
}
