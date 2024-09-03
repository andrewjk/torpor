import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/For.tera";

test("for -- mounted", () => {
	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("for -- hydrated", () => {
	const container = document.createElement("div");
	const path = "./test/for/components/For.tera";
	hydrateComponent(container, path, Component);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "0")).toBeInTheDocument();
	expect(queryByText(container, "1")).toBeInTheDocument();
	expect(queryByText(container, "2")).toBeInTheDocument();
	expect(queryByText(container, "3")).toBeInTheDocument();
	expect(queryByText(container, "4")).toBeInTheDocument();
	expect(queryByText(container, "5")).toBeNull();
}
