import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function TryCatchNested() {
	function boom() {
		throw new Error("inner boom");
	}

	@render {
		@try {
			@try {
				@const x = boom()
				<p>Inner ok</p>
			} catch (inner) {
				<p>Inner caught: {inner.message}</p>
			}
		} catch (outer) {
			<p>Outer caught: {outer.message}</p>
		}
	}
}
`;

test("try catch -- inner boundary catches first", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Inner caught: inner boom")).not.toBeNull();
	expect(queryByText(container, "Inner ok")).toBeNull();
	expect(queryByText(container, "Outer caught: inner boom")).toBeNull();
});

test("try catch -- inner boundary catches first -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Inner caught: inner boom")).not.toBeNull();
	expect(queryByText(container, "Outer caught: inner boom")).toBeNull();
});
