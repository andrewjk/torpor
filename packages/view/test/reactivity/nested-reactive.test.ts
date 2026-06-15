import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	user: { name: string; tags: string[] };
}

const source = `
export default function NestedReactive($props: { user: { name: string; tags: string[] } }) {
	@render {
		<p>Name: {$props.user.name}</p>
		<ul>
			@for (let tag of $props.user.tags) {
				<li>{tag}</li>
			}
		</ul>
		<p>Tag count: {$props.user.tags.length}</p>
	}
}
`;

test("nested reactive object with array -- mounted", async () => {
	let $state = $watch({
		user: {
			name: "Alice",
			tags: ["dev", "admin"],
		},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(queryByText(container, "Name: Alice")).not.toBeNull();
	expect(queryByText(container, "Tag count: 2")).not.toBeNull();
	expect(queryByText(container, "dev")).not.toBeNull();
	expect(queryByText(container, "admin")).not.toBeNull();

	// Push a new tag
	$state.user.tags.push("moderator");
	expect(queryByText(container, "Tag count: 3")).not.toBeNull();
	expect(queryByText(container, "moderator")).not.toBeNull();

	// Change name
	$state.user.name = "Bob";
	expect(queryByText(container, "Name: Bob")).not.toBeNull();

	// Replace entire tags array
	$state.user.tags = ["user"];
	expect(queryByText(container, "Tag count: 1")).not.toBeNull();
	expect(queryByText(container, "user")).not.toBeNull();
	expect(queryByText(container, "dev")).toBeNull();
});

test("nested reactive object with array -- hydrated", async () => {
	let $state = $watch({
		user: {
			name: "Alice",
			tags: ["dev", "admin"],
		},
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "Name: Alice")).not.toBeNull();
	expect(queryByText(container, "Tag count: 2")).not.toBeNull();

	$state.user.tags.push("new");
	expect(queryByText(container, "Tag count: 3")).not.toBeNull();
});
