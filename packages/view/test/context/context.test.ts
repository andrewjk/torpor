import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Parent() {
	$context["ParentContext"] = "hi from the parent";

	@render {
		<ChildA />
		<ChildB />
	}
}

function ChildA() {
	$context["ChildAContext"] = "hi!";

	@render {
		<p>Parent: {$context["ParentContext"]}</p>
		<p>Child a: {$context["ChildAContext"]}</p>
		<p>Child b: {$context["ChildBContext"] ?? "???"}</p>
	}
}

function ChildB() {
	$context["ChildBContext"] = "hi!";

	@render {
		<p>Nothing to see here...</p>
	}
}
`;

test("context -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("context -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "Parent: hi from the parent")).not.toBeNull();
	expect(queryByText(container, "Child a: hi!")).not.toBeNull();
	expect(queryByText(container, "Child b: ???")).not.toBeNull();
	expect(queryByText(container, "Nothing to see here...")).not.toBeNull();
}
