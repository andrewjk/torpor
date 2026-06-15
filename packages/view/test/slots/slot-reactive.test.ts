import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function SlotReactive($props: { label: string }) {
	@render {
		<Labeled>
			<p>{$props.label}</p>
		</Labeled>
	}
}

function Labeled() {
	@render {
		<div>
			<strong>Label:</strong>
			<slot />
		</div>
	}
}
`;

test("slot reactive data -- mounted", async () => {
	let $state = $watch({ label: "Hello" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("slot reactive data -- hydrated", async () => {
	let $state = $watch({ label: "Hello" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Hello")).not.toBeNull();
	expect(queryByText(container, "Label:")).not.toBeNull();

	state.label = "World";
	expect(queryByText(container, "World")).not.toBeNull();
	expect(queryByText(container, "Hello")).toBeNull();
}

interface Props {
	label: string;
}
