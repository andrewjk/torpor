import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrate from "../../src/render/hydrate";
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
		<meta name="description" content="A test" />
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
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

test("special head -- server rendered", async () => {
	let $state = $watch({
		level: 1,
	});

	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { head } = await serverComponent($state);

	expect(head).toContain("<title>Hello</title>");
	expect(head).toContain(`<meta name="description" content="A test">`);
});

test("special head -- hydrated with server rendered head does not duplicate", async () => {
	let $state = $watch({
		level: 1,
	});

	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body, head } = await serverComponent($state);

	// The earlier tests in this file already appended head elements to the
	// shared document head, so start from a clean slate
	for (let el of document.head.querySelectorAll('meta[name="description"]')) {
		el.remove();
	}

	// Put the server rendered head into the document head, like a real page load
	const fragment = document.createRange().createContextualFragment(head);
	const added = [...fragment.childNodes];
	document.head.appendChild(fragment);

	const container = document.createElement("div");
	container.innerHTML = body;
	container.ownerDocument.body.appendChild(container);
	hydrate(container, clientComponent, $state);

	expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
	expect(container.ownerDocument.title).toBe("Hello");

	// Clean up after ourselves
	for (let node of added) {
		node.remove();
	}
	container.remove();
});

function check(container: HTMLElement, _state: Props) {
	//console.log(container.textContent);
	//expect(queryByText(container, "Title: Hello")).not.toBeNull();
	expect(container.ownerDocument.title).toBe("Hello");
}
