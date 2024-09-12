import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Attributes.tera";

interface State {
	thing: any;
	dataThing: any;
}

test("attributes disappearing -- mounted", () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("attributes disappearing -- hydrated", () => {
	let $state = $watch({
		thing: "thing1",
		dataThing: "thing2",
	});

	const container = document.createElement("div");
	const path = "./test/attributes/components/Attributes.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(queryByText(container, "Hello!")).toBeInTheDocument();
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
