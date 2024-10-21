import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Class.tera";

interface State {
	red: boolean;
	green: boolean;
	blue: boolean;
}

test("class -- mounted", () => {
	let $state = $watch({
		red: true,
		green: false,
		blue: true,
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("class -- hydrated", () => {
	let $state = $watch({
		red: true,
		green: false,
		blue: true,
	});

	const container = document.createElement("div");
	const path = "./test/class/components/Class.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveClass("hello red blue", { exact: true });

	state.green = true;
	state.blue = false;

	expect(queryByText(container, "Hello!")).toHaveClass("hello red green", { exact: true });
}
