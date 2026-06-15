import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AttrNull($props: { title: string | null; label: string | undefined; count: number | null }) {
	@render {
		<div title={$props.title} aria-label={$props.label} data-count={$props.count}>
			Content
		</div>
	}
}
`;

test("null/undefined attributes removed -- mounted", async () => {
	let $state = $watch<{ title: string | null; label: string | undefined; count: number | null }>({
		title: null,
		label: undefined,
		count: null,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const div = queryByText(container, "Content")!;
	expect(div).not.toHaveAttribute("title");
	expect(div).not.toHaveAttribute("aria-label");
	expect(div).not.toHaveAttribute("data-count");

	$state.title = "real title";
	$state.label = "real label";
	$state.count = 42;

	expect(div).toHaveAttribute("title", "real title");
	expect(div).toHaveAttribute("aria-label", "real label");
	expect(div).toHaveAttribute("data-count", "42");

	$state.title = null;
	$state.label = undefined;
	$state.count = null;

	expect(div).not.toHaveAttribute("title");
	expect(div).not.toHaveAttribute("aria-label");
	expect(div).not.toHaveAttribute("data-count");
});

test("null/undefined attributes removed -- hydrated", async () => {
	let $state = $watch<{ title: string | null; label: string | undefined; count: number | null }>({
		title: "initial",
		label: "initialLabel",
		count: 1,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	const div = queryByText(container, "Content")!;
	expect(div).toHaveAttribute("title", "initial");

	$state.title = null;
	expect(div).not.toHaveAttribute("title");
});
