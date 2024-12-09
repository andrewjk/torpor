import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/party/components/AnswerButtonApp";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("emit to parent -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("emit to parent -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const user = userEvent.setup();
	const yesButton = container.getElementsByTagName("button")[0];
	const noButton = container.getElementsByTagName("button")[1];

	expect(queryByText(container, "😀")).not.toBeNull();
	expect(queryByText(container, "😥")).toBeNull();

	await user.click(noButton);

	expect(queryByText(container, "😀")).toBeNull();
	expect(queryByText(container, "😥")).not.toBeNull();

	await user.click(yesButton);

	expect(queryByText(container, "😀")).not.toBeNull();
	expect(queryByText(container, "😥")).toBeNull();
}
