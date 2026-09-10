import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MultipleChildren($props: { text: string }) {
	@render {
		<Card>
			<h1>Title</h1>
			<p>Body text</p>
			<footer>Footer</footer>
		</Card>
		<p>{$props.text}</p>
	}
}

function Card() {
	@render {
		<div class="card">
			<slot />
		</div>
	}
}
`;

test("multiple children -- mounted", async () => {
	let $state = $watch({ text: "hello" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("multiple children -- hydrated", async () => {
	let $state = $watch({ text: "hello" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "Title")).not.toBeNull();
	expect(queryByText(container, "Body text")).not.toBeNull();
	expect(queryByText(container, "Footer")).not.toBeNull();
	expect(queryByText(container, "hello")).not.toBeNull();

	state.text = "world";
	expect(queryByText(container, "world")).not.toBeNull();
	expect(queryByText(container, "hello")).toBeNull();
}

interface Props {
	text: string;
}
