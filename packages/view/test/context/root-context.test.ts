import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrate from "../../src/render/hydrate";
import mount from "../../src/render/mount";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";

const source = `
function Child() {
	// Destructuring keeps the object, so reads through it stay reactive
	let { $app } = $context;

	@render {
		<p>{$app.name} / {$context.$app.count}</p>
	}
}

export default function RootContext() {
	@render {
		<section>
			<Child />
		</section>
	}
}
`;

test("mount passes a root context to the component and its descendants", async () => {
	const component = await importComponent(import.meta.filename, source, "client");
	const $app = $watch({ name: "torpor", count: 1 });

	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, component, undefined, undefined, { $app });

	expect(container.querySelector("p")).toHaveTextContent("torpor / 1");

	$app.name = "view";
	$app.count = 2;
	await new Promise((resolve) => setTimeout(resolve));

	expect(container.querySelector("p")).toHaveTextContent("view / 2");
});

test("hydrate passes a root context to the component and its descendants", async () => {
	const client = await importComponent(import.meta.filename, source, "client");
	const server = await importComponent(import.meta.filename, source, "server");
	const $app = $watch({ name: "torpor", count: 1 });

	const container = document.createElement("div");
	container.innerHTML = (await server(undefined, { $app })).body;
	document.body.appendChild(container);
	expect(container.querySelector("p")).toHaveTextContent("torpor / 1");

	hydrate(container, client, undefined, undefined, { $app });

	$app.count = 3;
	await new Promise((resolve) => setTimeout(resolve));

	expect(container.querySelector("p")).toHaveTextContent("torpor / 3");
});
