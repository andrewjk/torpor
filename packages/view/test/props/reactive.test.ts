import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Reactive($props: any) {
	let $state = $watch({ text: "before" })

	@render {
		<button onclick={() => $state.text = "after"}>Update text</button>
		<Child text={$state.text} />
	}
}

function Child($props: any) {
	@render {
		<p>
			{$props.text}
		</p>
	}
}
`;

test("props reactive -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("props reactive -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	expect(queryByText(container, "before")).toBeInTheDocument();

	await userEvent.click(getByText(container, "Update text"));

	expect(queryByText(container, "before")).not.toBeInTheDocument();
	expect(queryByText(container, "after")).toBeInTheDocument();
}
