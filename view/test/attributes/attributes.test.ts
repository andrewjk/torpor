import { $watch } from "@tera/view";
import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Attributes.tera";

interface State {
	thing: any;
	dataThing: any;
	description: string;
}

test("attributes -- mounted", () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
		description: "a person",
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("attributes -- hydrated", () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
		description: "a person",
	});

	const container = document.createElement("div");
	const path = "./test/attributes/components/Attributes.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveAttribute("thing", "thing1");
	expect(queryByText(container, "Hello!")).toHaveAttribute("data-thing", "thing2");
	expect(queryByText(container, "Hello!")).toHaveAttribute(
		"caption",
		"this attribute is for a person",
	);
}
