import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { beforeAll, expect, test, vi } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/events/components/Increment";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("events -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	check(container);
});

test("events -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	check(container);
});

async function check(container: HTMLElement) {
	// HACK: this useFakeTimers call seems to prevent intermittent exceptions
	// being thrown
	vi.useFakeTimers({
		shouldAdvanceTime: true,
	});
	const user = userEvent.setup();

	expect(queryByText(container, "The count is 0.")).not.toBeNull();

	const increment = Array.from(container.children).find((e) => e.id === "increment");
	expect(increment).not.toBeNull();
	await user.click(increment!);

	expect(queryByText(container, "The count is 1.")).not.toBeNull();

	const increment5 = Array.from(container.children).find((e) => e.id === "increment5");
	expect(increment5).not.toBeNull();
	await user.click(increment5!);

	expect(queryByText(container, "The count is 6.")).not.toBeNull();
}
