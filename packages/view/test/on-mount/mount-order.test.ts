import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MountOrder() {
	let order: string[] = [];

	$mount(() => {
		order.push("first");
	});

	$mount(() => {
		order.push("second");
	});

	$mount(() => {
		order.push("third");
	});

	@render {
		<p>Mount order: {order.join(", ")}</p>
	}
}
`;

test("mount order -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(queryByText(container, "Mount order: first, second, third")).not.toBeNull();
});

test("mount order -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	expect(queryByText(container, "Mount order: first, second, third")).not.toBeNull();
});
