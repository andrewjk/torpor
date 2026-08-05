import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function BindCheckbox() {
	let $state = $watch({ agreed: false });

	@render {
		<label>
			<input type="checkbox" &value={$state.agreed} />
			I agree
		</label>
		<p>Agreed: {$state.agreed}</p>
	}
}
`;

test("bind checkbox -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind checkbox -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
	expect(checkbox).not.toBeNull();
	expect(checkbox.checked).toBe(false);
	expect(queryByText(container, "Agreed: false")).not.toBeNull();

	await userEvent.click(checkbox);

	expect(checkbox.checked).toBe(true);
	expect(queryByText(container, "Agreed: true")).not.toBeNull();

	await userEvent.click(checkbox);

	expect(checkbox.checked).toBe(false);
	expect(queryByText(container, "Agreed: false")).not.toBeNull();
}
