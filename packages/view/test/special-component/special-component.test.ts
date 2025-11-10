import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	self: any;
}

const source = `
export default function Component() {
	let components: Record<PropertyKey, any> = {
		BigTitle,
		SmallTitle
	};

	@render {
		<@component self={components[$props.self]}>
			Hello!
		</@component>
	}
}

function BigTitle() {
	@render {
		<h2>
			<slot />
		</h2>
	}
}

function SmallTitle() {
	@render {
		<h6>
			<slot />
		</h6>
	}
}
`;

test("special component -- mounted", async () => {
	let $state = $watch({
		self: "BigTitle",
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special component -- hydrated", async () => {
	let $state = $watch({
		self: "BigTitle",
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, $state: Props) {
	expect(queryByText(container, "Hello!")).not.toBeNull();
	expect(queryByText(container, "Hello!")?.tagName).toBe("H2");

	$state.self = "SmallTitle";

	expect(queryByText(container, "Hello!")?.tagName).toBe("H6");
}
