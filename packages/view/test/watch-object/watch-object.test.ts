import "@testing-library/jest-dom/vitest";
import { assert, expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	text: string;
	child: {
		childText: string;
		grandChild: {
			grandChildText: string;
		};
	};
}

const source = `
export default function Watched() {
	@render {
		<p>
			{$props.text}
			{$props.child.childText}
			{$props.child.grandChild.grandChildText}
		</p>
	}
}
`;

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
	const component = await importComponent(import.meta.filename, source, "client");
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
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	assert(container.textContent);

	expect(container.textContent.replace(/\s+/g, " ").trim()).toBe("top child grandchild");

	//console.log("setting state.child.grandChild");
	state.child.grandChild = {
		grandChildText: "changed",
	};

	expect(container.textContent.replace(/\s+/g, " ").trim()).toBe("top child changed");

	//console.log("setting state.child");
	state.child = {
		childText: "new_child",
		grandChild: {
			grandChildText: "new_grandchild",
		},
	};

	expect(container.textContent.replace(/\s+/g, " ").trim()).toBe("top new_child new_grandchild");

	// Make sure that effects have been transferred across
	//console.log("setting state.child.grandchild.grandchildtext");
	state.child.grandChild.grandChildText = "even_newer_grandchild";

	expect(container.textContent.replace(/\s+/g, " ").trim()).toBe(
		"top new_child even_newer_grandchild",
	);
}
