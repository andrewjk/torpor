import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";
import ArrayState from "./ArrayState";

const componentPath = "./test/watch-array/components/ArrayIndexes";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

test("array indexes -- mounted", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("array indexes -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, text: "b" },
			{ id: 2, text: "a" },
			{ id: 3, text: "d" },
			{ id: 4, text: "c" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: ArrayState) {
	// TODO: Should have spaces between letter items
	expect(container.textContent!.replace(/\s/g, "")).toBe("^b,a,d,c$");

	state.items.sort((a, b) => a.text.localeCompare(b.text));

	expect(container.textContent!.replace(/\s/g, "")).toBe("^a,b,c,d$");

	state.items[1].text = "e";

	expect(container.textContent!.replace(/\s/g, "")).toBe("^a,e,c,d$");
}
