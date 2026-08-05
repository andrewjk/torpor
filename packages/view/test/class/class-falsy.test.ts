import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ClassFalsy($props: { a: boolean; b: boolean; c: number; d: number; e: string; f: string }) {
	@render {
		<p class={{ a: $props.a, b: $props.b, c: $props.c, d: $props.d, e: $props.e, f: $props.f }}>
			Falsy values
		</p>
	}
}
`;

test("class falsy values -- mounted", async () => {
	let $state = $watch({ a: true, b: false, c: 1, d: 0, e: "yes", f: "" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("class falsy values -- hydrated", async () => {
	let $state = $watch({ a: true, b: false, c: 1, d: 0, e: "yes", f: "" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const el = queryByText(container, "Falsy values")!;
	// a: true -> included, b: false -> excluded, c: 1 -> included, d: 0 -> excluded, e: "yes" -> included, f: "" -> excluded
	expect(el.className).toContain("a");
	expect(el.className).not.toContain("b ");
	expect(el.className).toContain("c");
	expect(el.className).not.toContain("d ");
	expect(el.className).toContain("e");
	expect(el.className).not.toContain("f ");

	state.b = true;
	state.d = 1;
	expect(el.className).toContain("b");
	expect(el.className).toContain("d");
}

interface Props {
	a: boolean;
	b: boolean;
	c: number;
	d: number;
	e: string;
	f: string;
}
