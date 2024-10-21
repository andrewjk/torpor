import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Head.tera";

interface State {
	level: number;
}

test("special head -- mounted", () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("special head -- hydrated", () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const path = "./test/special-head/components/Head.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	//console.log(container.textContent);
	//expect(queryByText(container, "Title: Hello")).not.toBeNull();
	expect(container.ownerDocument.title).toBe("Hello");
}
