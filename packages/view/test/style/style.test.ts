import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	color: string;
}

const source = `
export default function Style() {
	@render {
		<div style={{ color: $props.color }}>
			Hello!
		</div>
	}
}
`;

test("style -- mounted", async () => {
	let $state = $watch({
		color: "#aaa",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("style -- hydrated", async () => {
	let $state = $watch({
		color: "#aaa",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")).toHaveStyle({ color: "#aaa" });

	// Change state
	state.color = "#bbb";

	expect(queryByText(container, "Hello!")).toHaveStyle({ color: "#bbb" });
}
