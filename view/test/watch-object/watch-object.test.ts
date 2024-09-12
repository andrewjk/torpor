import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/$watch";
import hydrateComponent from "../hydrateComponent";
import mountComponent from "../mountComponent";
import Component from "./components/Object.tera";

interface State {
	text: string;
	child: {
		childText: string;
		grandChild: {
			grandChildText: string;
		};
	};
}

test("watch object -- mounted", async () => {
	const state = $watch({
		text: "top",
		child: {
			childText: "child",
			grandChild: {
				grandChildText: "grandchild",
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
			grandChild: {
				grandChildText: "grandchild",
			},
		},
	});

	const container = document.createElement("div");
	const path = "./test/watch-object/components/Object.tera";
	hydrateComponent(container, path, Component, state);

	check(container, state);
});

function check(container: HTMLElement, state: State) {
	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child grandchild");

	console.log("setting state.child.grandChild");
	state.child.grandChild = {
		grandChildText: "changed",
	};

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child changed");

	console.log("setting state.child");
	state.child = {
		childText: "new_child",
		grandChild: {
			grandChildText: "new_grandchild",
		},
	};

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top new_child new_grandchild");

	console.log("setting state.child.grandchild.grandchildtext");
	// Make sure that effects have been transferred across
	state.child.grandChild.grandChildText = "even_newer_grandchild";

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe(
		"top new_child even_newer_grandchild",
	);
}
