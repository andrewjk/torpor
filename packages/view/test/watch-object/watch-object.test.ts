import "@testing-library/jest-dom/vitest";
import { beforeAll, expect, test } from "vitest";
import $watch from "../../src/render/$watch";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/watch-object/components/Watched";

beforeAll(async () => {
	await buildOutputFiles(componentPath);
});

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
	let $state = $watch({
		text: "top",
		child: {
			childText: "child",
			grandChild: {
				grandChildText: "grandchild",
			},
		},
	});

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("watch object -- hydrated", async () => {
	let $state = $watch({
		text: "top",
		child: {
			childText: "child",
			grandChild: {
				grandChildText: "grandchild",
			},
		},
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: State) {
	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child grandchild");

	//console.log("setting state.child.grandChild");
	state.child.grandChild = {
		grandChildText: "changed",
	};

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top child changed");

	//console.log("setting state.child");
	state.child = {
		childText: "new_child",
		grandChild: {
			grandChildText: "new_grandchild",
		},
	};

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe("top new_child new_grandchild");

	// Make sure that effects have been transferred across
	//console.log("setting state.child.grandchild.grandchildtext");
	state.child.grandChild.grandChildText = "even_newer_grandchild";

	expect(container.textContent!.replace(/\s+/g, " ").trim()).toBe(
		"top new_child even_newer_grandchild",
	);
}
