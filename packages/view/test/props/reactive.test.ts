import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import { $watch } from "../../src";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/props/components/Reactive";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

interface State {
	text: string;
}

test("props reactive -- mounted", async () => {
	let $state = $watch({ text: "before" });

	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("props reactive -- hydrated", async () => {
	let $state = $watch({ text: "before" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

async function check(container: HTMLElement, $state: State) {
	expect(queryByText(container, "before")).toBeInTheDocument();

	await userEvent.click(getByText(container, "Update text"));

	$state.text = "after";

	expect(queryByText(container, "before")).not.toBeInTheDocument();
	expect(queryByText(container, "after")).toBeInTheDocument();
}
