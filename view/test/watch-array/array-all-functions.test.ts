import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import type ArrayState from "./ArrayState";

let componentFile = "./components/Array.tera";

test("array calling all functions -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("array calling all functions -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const state = $watch({
		items: [
			{ id: 1, text: "a" },
			{ id: 2, text: "b" },
			{ id: 3, text: "c" },
			{ id: 4, text: "d" },
		],
	});

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: ArrayState) {
	expect(container.textContent!.replace(/\s/g, "")).toBe("^abcd$");

	state.items.pop();
	// console.log('pop', container.innerHTML)

	expect(container.textContent!.replace(/\s/g, "")).toBe("^abc$");

	state.items.push({ id: 5, text: "e" });
	// console.log('push', container.innerHTML)

	expect(container.textContent!.replace(/\s/g, "")).toBe("^abce$");

	state.items.reverse();
	// console.log('reverse', container.innerHTML)

	expect(container.textContent!.replace(/\s/g, "")).toBe("^ecba$");

	state.items.shift();
	// console.log('shift', container.innerHTML)

	expect(container.textContent!.replace(/\s/g, "")).toBe("^cba$");

	state.items.sort((a, b) => a.text.localeCompare(b.text));
	// console.log('sort', container.innerHTML)

	expect(container.textContent!.replace(/\s/g, "")).toBe("^abc$");

	state.items.splice(1, 1, { id: 6, text: "f" });
	// console.log('splice', container.innerHTML)

	expect(container.textContent!.replace(/\s/g, "")).toBe("^afc$");

	state.items.unshift({ id: 7, text: "g" });
	// console.log('unshift', container.innerHTML)

	expect(container.textContent!.replace(/\s/g, "")).toBe("^gafc$");
}
