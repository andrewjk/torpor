import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AwaitResolved() {
	let $state = $watch({
		data: Promise.resolve("loaded data")
	});

	@render {
		@await ($state.data) {
			<p>Loading...</p>
		} then (result) {
			<p>Result: {result}</p>
		} catch (ex) {
			<p>Error: {ex}</p>
		}
	}
}
`;

test("await resolved -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Loading...")).not.toBeNull();

	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: loaded data")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();
});

test("await resolved -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: loaded data")).not.toBeNull());
});
