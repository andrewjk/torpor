import "@testing-library/jest-dom/vitest";
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { setUrlRewriter } from "../../src/render/urlAttributes";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function Links($props: { href: string; items: string[] }) {
	@render {
		<a id="static" href="/static">Static</a>
		<a id="dynamic" {$props.href}>Dynamic</a>
		<a id="external" href="https://example.com/x">External</a>
		<a id="hash" href="#top">Hash</a>
		<img src="/logo.png" />
		<form action="/save"></form>
		<ul>
			@for (let item of $props.items) {
				<li><a class="item" href={"/items/" + item}>{item}</a></li>
			}
		</ul>
	}
}
`;

// Like @torpor/build's base path: absolute paths get "/app"
beforeAll(() => {
	setUrlRewriter((url) => (url.startsWith("/") && !url.startsWith("/app/") ? "/app" + url : url));
});

afterAll(() => {
	setUrlRewriter(undefined);
});

function check(container: HTMLElement) {
	expect(container.querySelector("#static")).toHaveAttribute("href", "/app/static");
	expect(container.querySelector("#dynamic")).toHaveAttribute("href", "/app/docs");
	expect(container.querySelector("#external")).toHaveAttribute("href", "https://example.com/x");
	expect(container.querySelector("#hash")).toHaveAttribute("href", "#top");
	expect(container.querySelector("img")).toHaveAttribute("src", "/app/logo.png");
	expect(container.querySelector("form")).toHaveAttribute("action", "/app/save");
	expect([...container.querySelectorAll(".item")].map((a) => a.getAttribute("href"))).toEqual([
		"/app/items/a",
		"/app/items/b",
	]);
}

test("url rewriter -- mounted", async () => {
	let $state = $watch({ href: "/docs", items: ["a", "b"] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container);

	$state.href = "/other";
	$state.items.push("c");
	expect(container.querySelector("#dynamic")).toHaveAttribute("href", "/app/other");
	expect(container.querySelectorAll(".item")[2]).toHaveAttribute("href", "/app/items/c");
});

test("url rewriter -- hydrated", async () => {
	let $state = $watch({ href: "/docs", items: ["a", "b"] });

	const container = document.createElement("div");
	const client = await importComponent(import.meta.filename, source, "client");
	const server = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, client, server, $state);

	// The server render has no rewriter (@torpor/build rewrites its HTML), so
	// only attributes the client sets get the base here
	expect(container.querySelector("#dynamic")).toHaveAttribute("href", "/app/docs");
	expect(container.querySelector(".item")).toHaveAttribute("href", "/app/items/a");
});
