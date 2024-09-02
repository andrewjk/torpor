import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

let componentFile = "./components/Increment.tera";

test("events -- mounted", async () => {
	let { Component } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	mountComponent(container, Component);

	check(container);
});

test("events -- hydrated", async () => {
	let { Component, componentPath } = await importComponent(expect, componentFile);

	const container = document.createElement("div");
	hydrateComponent(container, componentPath, Component);

	check(container);
});

async function check(container: HTMLElement) {
	// HACK: this useFakeTimers call seems to prevent intermittent exceptions
	// being thrown
	vi.useFakeTimers({
		shouldAdvanceTime: true,
	});
	const user = userEvent.setup();

	expect(queryByText(container, "The count is 0.")).toBeInTheDocument();

	const increment = Array.from(container.children).find((e) => e.id === "increment");
	expect(increment).not.toBeNull();
	await user.click(increment!);

	expect(queryByText(container, "The count is 1.")).toBeInTheDocument();

	const increment5 = Array.from(container.children).find((e) => e.id === "increment5");
	expect(increment5).not.toBeNull();
	await user.click(increment5!);

	expect(queryByText(container, "The count is 6.")).toBeInTheDocument();
}
