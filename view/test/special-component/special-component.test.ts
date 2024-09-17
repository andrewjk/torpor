import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Component.tera";

interface State {
	self: any;
}

test("special component -- mounted", () => {
	let $state = $watch({
		self: "BigTitle",
	});

	const container = document.createElement("div");
	mountComponent(container, Component, $state);

	check(container, $state);
});

test("special component -- hydrated", () => {
	let $state = $watch({
		self: "BigTitle",
	});

	const container = document.createElement("div");
	const path = "./test/special-component/components/Component.tera";
	hydrateComponent(container, path, Component, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "Hello!")).toBeInTheDocument();
	expect(queryByText(container, "Hello!")?.tagName).toBe("H2");

	$state.self = "SmallTitle";

	expect(queryByText(container, "Hello!")?.tagName).toBe("H6");
}
