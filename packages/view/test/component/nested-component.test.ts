import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	parentName: string;
	childName: string;
}

const source = `
export default function NestedComponent($props: { parentName: string }) {
	@render {
		<h1>{$props.parentName}</h1>
		<Parent name={$props.parentName}>
			<Child name={$props.parentName} />
		</Parent>
	}
}

function Parent() {
	@render {
		<div>
			<p>Parent: {$props.name}</p>
			<slot />
		</div>
	}
}

function Child() {
	@render {
		<p>Child: {$props.name}</p>
	}
}
`;

test("nested components -- mounted", async () => {
	let $state = $watch({ parentName: "Alice", childName: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("nested components -- hydrated", async () => {
	let $state = $watch({ parentName: "Alice", childName: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Alice")).not.toBeNull();
	expect(queryByText(container, "Parent: Alice")).not.toBeNull();
	expect(queryByText(container, "Child: Alice")).not.toBeNull();

	state.parentName = "Bob";
	expect(queryByText(container, "Bob")).not.toBeNull();
	expect(queryByText(container, "Parent: Bob")).not.toBeNull();
	expect(queryByText(container, "Child: Bob")).not.toBeNull();
}
