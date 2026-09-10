import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function BindTextarea() {
	let $state = $watch({ message: "Initial text" });

	@render {
		<textarea &value={$state.message}></textarea>
		<p>Preview: {$state.message}</p>
	}
}
`;

test("bind textarea -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind textarea -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
	expect(textarea).not.toBeNull();
	expect(textarea.value).toBe("Initial text");
	expect(queryByText(container, "Preview: Initial text")).not.toBeNull();

	await userEvent.clear(textarea);
	await userEvent.type(textarea, "New content");

	expect(textarea.value).toBe("New content");
	expect(queryByText(container, "Preview: New content")).not.toBeNull();
}
