import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	tabs: string[];
	activeTab: string;
}

const source = `
export default function ForWithIfElse($props: { tabs: string[]; activeTab: string }) {
	@render {
		<nav>
			@for (let tab of $props.tabs) {
				@if (tab === $props.activeTab) {
					<button class="active">{tab}</button>
				} else {
					<button>{tab}</button>
				}
			}
		</nav>
		<p>Active: {$props.activeTab}</p>
	}
}
`;

test("for with if else -- mounted", async () => {
	let $state = $watch({ tabs: ["home", "about", "contact"], activeTab: "home" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for with if else -- hydrated", async () => {
	let $state = $watch({ tabs: ["home", "about", "contact"], activeTab: "home" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const buttons = container.querySelectorAll("button");
	expect(buttons.length).toBe(3);

	const activeBtn = Array.from(buttons).find((b) => b.className.includes("active"));
	expect(activeBtn).toBeDefined();
	expect(activeBtn).toHaveTextContent("home");
	expect(queryByText(container, "Active: home")).not.toBeNull();

	state.activeTab = "about";
	const newActive = Array.from(container.querySelectorAll("button")).find((b) =>
		b.className.includes("active"),
	);
	expect(newActive).toHaveTextContent("about");
	expect(queryByText(container, "Active: about")).not.toBeNull();

	state.tabs = ["settings"];
	const settingsButtons = container.querySelectorAll("button");
	expect(settingsButtons.length).toBe(1);
	expect(settingsButtons[0]).toHaveTextContent("settings");
}
