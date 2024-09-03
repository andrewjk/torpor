import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Object.tera";

interface State {
	text: string;
	child: {
		childText: string;
		item: {
			itemText: string;
		};
	};
}

test("watch object -- mounted", async () => {
	const state = $watch({
		text: "top",
		child: {
			childText: "child",
			item: {
				itemText: "item",
			},
		},
	});

	const container = document.createElement("div");
	mountComponent(container, Component, state);

	check(container, state);
});

test("watch object -- hydrated", async () => {
	const state = $watch({
		text: "top",
		child: {
			childText: "child",
			item: {
				itemText: "item",
			},
		},
	});

	const container = document.createElement("div");
	const path = "./test/watch-object/components/Object.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child item");

	state.child.item = {
		itemText: "changed",
	};

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child changed");

	state.child = {
		childText: "new_child",
		item: {
			itemText: "new_item",
		},
	};

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top new_child new_item");
	//printContext();
	// Make sure that effects have been transferred across
	state.child.item.itemText = "even_newer_item";

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top new_child even_newer_item");
}
