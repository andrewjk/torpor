import { getByText, queryByText, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/await/components/Await";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("await -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("await -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Is it a number?")).not.toBeNull();

	await user.click(getByText(container, "Guess again"));

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Is it a number?")).not.toBeNull();

	await user.click(getByText(container, "Guess again"));

	expect(queryByText(container, "Hmm...")).not.toBeNull();
	expect(queryByText(container, "Is it a number?")).toBeNull();

	await waitFor(() => expect(queryByText(container, "Hmm...")).toBeNull());

	expect(queryByText(container, "Hmm...")).toBeNull();
	expect(queryByText(container, "Something went wrong: uh oh!")).not.toBeNull();
}
