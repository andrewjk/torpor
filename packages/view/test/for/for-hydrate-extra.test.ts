import { expect, test } from "vite-plus/test";
import hydrate from "../../src/render/hydrate";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";

const source = `
export default function RootList($props: { items: string[] }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				<li>{item}</li>
			}
		</ul>
		<p>after</p>
	}
}
`;

function items(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent ?? "");
}

async function hydrateWith(server: string[], client: string[]): Promise<HTMLElement> {
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body } = await serverComponent($watch({ items: server }));

	const container = document.createElement("div");
	container.innerHTML = body;
	container.ownerDocument.body.appendChild(container);
	hydrate(container, clientComponent, $watch({ items: client }));
	return container;
}

test("root list -- hydrate with more client items than server", async () => {
	const container = await hydrateWith([], ["hello"]);

	expect(items(container)).toEqual(["hello"]);
	expect(container.querySelector("p")?.textContent).toBe("after");
});

test("root list -- hydrate extra items after the server rows", async () => {
	const container = await hydrateWith(["one"], ["one", "two", "three"]);

	expect(items(container)).toEqual(["one", "two", "three"]);
	expect(container.querySelector("p")?.textContent).toBe("after");
});
