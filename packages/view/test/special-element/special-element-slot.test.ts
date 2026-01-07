import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	tag: string;
}

const source = `
export default function Element() {
	@render {
		<Child {$props.tag}>
			Hello!
		</Child>
	}
}

function Child() {
	@render {
		<@element self={$props.tag}>
			<slot />
		</@element>
	}
}
`;

test("special element with slot -- mounted", async () => {
	let $state = $watch({
		tag: "h4",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special element with slot -- hydrated", async () => {
	let $state = $watch({
		tag: "h4",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: Props) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")?.tagName).toBe("H4");

	$state.tag = "p";

	expect(queryByText(container, "Hello!")?.tagName).toBe("P");
}
