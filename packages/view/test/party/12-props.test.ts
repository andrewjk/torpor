import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function UserProfileApp() {
	@render {
		<UserProfile
			name="John"
			age={20}
			favoriteColors={["green", "blue", "red"]}
			isAvailable
		/>
	}
}

function UserProfile($props: {
	name: string,
	age: number,
	favoriteColors: string[],
	isAvailable: boolean
}) {
	@render {
		<p>My name is {$props.name}!</p>
		<p>My age is {$props.age}!</p>
		<p>My favourite colors are {$props.favoriteColors.join(", ")}!</p>
		<p>I am {$props.isAvailable ? "available" : "not available"}</p>
	}
}
`;

test("props -- mounted", async () => {
	document.title = "Document Title";

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	check(container);
});

test("props -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "My name is John!")).not.toBeNull();
	expect(queryByText(container, "My age is 20!")).not.toBeNull();
	expect(queryByText(container, "My favourite colors are green, blue, red!")).not.toBeNull();
	expect(queryByText(container, "I am available")).not.toBeNull();
}
