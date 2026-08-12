import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ErrorBlock($props: { danger: boolean }) {
	function maybeThrow() {
		if ($props.danger) throw new Error("boom");
		return true;
	}

	@render {
		@if (maybeThrow()) {
			<p>All good</p>
		}
	}

	@error (err) {
		<p class="error">Oops: {err.message}</p>
	}
}
`;

test("error -- catches render errors", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $watch({ danger: true }));

	expect(queryByText(container, "All good")).toBeNull();
	expect(queryByText(container, "Oops: boom")).not.toBeNull();
});

test("error -- renders normally when nothing throws", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $watch({ danger: false }));

	expect(queryByText(container, "All good")).not.toBeNull();
	expect(queryByText(container, "Oops: boom")).toBeNull();
});

test("error -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $watch({ danger: true }));

	expect(queryByText(container, "All good")).toBeNull();
	expect(queryByText(container, "Oops: boom")).not.toBeNull();
});

test("error -- hydrated when nothing throws", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $watch({ danger: false }));

	expect(queryByText(container, "All good")).not.toBeNull();
	expect(queryByText(container, "Oops: boom")).toBeNull();
});
