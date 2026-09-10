import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AttrDynamic($props: { id: string; title: string; dataValue: string }) {
	@render {
		<div id={$props.id} title={$props.title} data-value={$props.dataValue}>
			Content
		</div>
	}
}
`;

test("dynamic attributes -- mounted", async () => {
	let $state = $watch({ id: "myid", title: "mytitle", dataValue: "mydata" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const div = queryByText(container, "Content")!;
	expect(div).toHaveAttribute("id", "myid");
	expect(div).toHaveAttribute("title", "mytitle");
	expect(div).toHaveAttribute("data-value", "mydata");

	$state.id = "newid";
	$state.title = "newtitle";
	$state.dataValue = "newdata";

	expect(div).toHaveAttribute("id", "newid");
	expect(div).toHaveAttribute("title", "newtitle");
	expect(div).toHaveAttribute("data-value", "newdata");
});

test("dynamic attributes -- hydrated", async () => {
	let $state = $watch({ id: "myid", title: "mytitle", dataValue: "mydata" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	const div = queryByText(container, "Content")!;
	expect(div).toHaveAttribute("id", "myid");

	$state.id = "changed";
	expect(div).toHaveAttribute("id", "changed");
});
