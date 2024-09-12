import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/OnMount.tera";

test("on:mount -- mounted", () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("on:mount -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/on-mount/components/OnMount.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];

	expect(input.value).toBe("hi");
}
