import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, test } from "vitest";
import buildOutputFiles from "../buildOutputFiles";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const componentPath = "./test/bind/components/BindText";

beforeAll(() => {
	buildOutputFiles(componentPath);
});

test("bind text value -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(componentPath, "client");
	mountComponent(container, component);

	await check(container);
});

test("bind text value -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(componentPath, "client");
	const serverComponent = await importComponent(componentPath, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	await check(container);
});

async function check(container: HTMLElement) {
	const input = container.getElementsByTagName("input")[0];
	const select = container.getElementsByTagName("select")[0];
	const para = container.getElementsByTagName("p")[0];
	const para2 = container.getElementsByTagName("p")[1];

	expect(input).toHaveValue("Alice");
	expect(para).toHaveTextContent("Hello, Alice");

	expect(select).toHaveValue("1");
	//expect(select.childNodes[1]).toHaveAttribute("selected", true);
	expect(para2).toHaveTextContent("You have selected, 1");

	// Update the input value
	await userEvent.clear(input);
	await userEvent.type(input, "Bob");
	await userEvent.selectOptions(select, "2");

	expect(input).toHaveValue("Bob");
	expect(para).toHaveTextContent("Hello, Bob");

	expect(select).toHaveValue("2");
	expect(para2).toHaveTextContent("You have selected, 2");
}
