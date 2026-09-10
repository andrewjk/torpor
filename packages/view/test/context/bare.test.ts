import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import parse from "../../src/compile/parse";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
function getContext(context: Record<PropertyKey, any> | undefined) {
	return context ?? {};
}

export default function Parent() {
	$context["ParentContext"] = "hi from the parent";

	@render {
		<Child />
	}
}

function Child() {
	// A bare \`$context\` read, e.g. passing the context object to a
	// helper function (as icon components do), without accessing a
	// property of it
	const context = getContext($context);

	@render {
		<p>Value: {context["ParentContext"]}</p>
	}
}
`;

test("context -- bare $context read", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Value: hi from the parent")).not.toBeNull();
});

test("context -- bare $context read, hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Value: hi from the parent")).not.toBeNull();
});

test("context -- $context in a sample string is ignored", () => {
	const input = `
export default function Test() {
	const sample = \`
		function Component() {
			const context = getIconContext($context);
		}
	\`;

	@render {
		<p>Hello!</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].contextProps).toBeUndefined();
});
