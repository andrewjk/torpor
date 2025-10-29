import "@testing-library/jest-dom/vitest";
import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	level: number;
}

const source = `
export default function Head() {
	@head {
		<title>Hello</title>
	}
}
`;

test("special head -- mounted", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("special head -- hydrated", async () => {
	let $state = $watch({
		level: 1,
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, _: Props) {
	//console.log(container.textContent);
	//expect(queryByText(container, "Title: Hello")).not.toBeNull();
	expect(container.ownerDocument.title).toBe("Hello");
}
