import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function BindComponentOptional() {
	let $state = $watch({ user: undefined as { name: string } | undefined });

	@render {
		<BindText &name={$state.user?.name} />
		<p>Hello, {$state.user?.name}</p>
		<button onclick={() => $state.user = { name: "Alice" }}>Set user</button>
	}
}

function BindText() {
	@render {
		<input &value={$props.name} />
	}
}
`;

test("bind component value through optional chaining -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind component value through optional chaining -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];
	const para = container.getElementsByTagName("p")[0];
	const button = container.getElementsByTagName("button")[0];

	// The target is missing, so the binding can't write to it
	expect(input).toHaveValue("");

	// The target comes into existence and the binding picks it up
	await userEvent.click(button);
	await tick();
	expect(input).toHaveValue("Alice");
	expect(para).toHaveTextContent("Hello, Alice");

	// The target exists, so the binding writes to it
	await userEvent.clear(input);
	await userEvent.type(input, "Bob");

	expect(input).toHaveValue("Bob");
	expect(para).toHaveTextContent("Hello, Bob");
}

function tick() {
	return new Promise((resolve) => setTimeout(resolve));
}
