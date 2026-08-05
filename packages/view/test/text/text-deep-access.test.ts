import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function DeepAccess($props: { user: { profile: { name: string; address: { city: string } } } }) {
	@render {
		<p>Name: {$props.user.profile.name}</p>
		<p>City: {$props.user.profile.address.city}</p>
	}
}
`;

test("deep nested object access -- mounted", async () => {
	let $state = $watch({
		user: {
			profile: {
				name: "Alice",
				address: { city: "NYC" },
			},
		},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Name: Alice")).not.toBeNull();
	expect(queryByText(container, "City: NYC")).not.toBeNull();

	// Mutate deep property
	$state.user.profile.name = "Bob";
	expect(queryByText(container, "Name: Bob")).not.toBeNull();

	$state.user.profile.address.city = "LA";
	expect(queryByText(container, "City: LA")).not.toBeNull();
});

test("deep nested object access -- hydrated", async () => {
	let $state = $watch({
		user: {
			profile: {
				name: "Alice",
				address: { city: "NYC" },
			},
		},
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Name: Alice")).not.toBeNull();

	$state.user.profile.name = "Bob";
	expect(queryByText(container, "Name: Bob")).not.toBeNull();
});
