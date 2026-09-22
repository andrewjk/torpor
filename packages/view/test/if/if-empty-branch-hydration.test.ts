import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function IfEmptyBranchHydration($props: { on?: boolean }) {
	let $state = $watch({ on: $props.on ?? false, hasImage: false, hasLink: false });
	@render {
		<div class="sibling">sibling content</div>
		@if ($state.on) {
			<div class="branch">branch content</div>
		} else {
			@if ($state.hasImage) {
				<div>image</div>
			} else if ($state.hasLink) {
				<div>link</div>
			}
		}
		<button onclick={() => $state.on = !$state.on}>toggle</button>
	}
}
`;

test("if with an empty else branch -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, {});

	check(container);
});

test("if with an empty else branch -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, {});

	check(container);
});

function check(container: HTMLElement) {
	expect(queryByText(container, "sibling content")).not.toBeNull();
	expect(queryByText(container, "branch content")).toBeNull();

	fireEvent.click(getByText(container, "toggle"));
	expect(queryByText(container, "sibling content")).not.toBeNull();
	expect(queryByText(container, "branch content")).not.toBeNull();

	fireEvent.click(getByText(container, "toggle"));
	expect(queryByText(container, "sibling content")).not.toBeNull();
	expect(queryByText(container, "branch content")).toBeNull();
}
