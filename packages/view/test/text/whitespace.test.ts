import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function WhitespaceTest($props: { name: string }) {
	@render {
		<div>
			Hello {$props.name}!
		</div>
	}
}
`;

test("whitespace around interpolation is preserved -- mounted", async () => {
	let $state = $watch({ name: "World" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	let div = container.querySelector("div");
	expect(div?.textContent?.trim()).toBe("Hello World!");
});

test("whitespace around interpolation is preserved -- hydrated", async () => {
	let $state = $watch({ name: "World" });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	let div = container.querySelector("div");
	expect(div?.textContent?.trim()).toBe("Hello World!");
});

test("multiple text nodes with whitespace", async () => {
	const multiSource = `
	export default function MultiText($props: { a: string, b: string }) {
		@render {
			<p>
				{$props.a} and {$props.b}
			</p>
		}
	}
	`;

	let $state = $watch({ a: "Foo", b: "Bar" });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, multiSource, "client");
	mountComponent(container, component, $state);

	let p = container.querySelector("p");
	expect(p?.textContent?.trim()).toBe("Foo and Bar");

	$state.a = "Hello";
	expect(p?.textContent?.trim()).toBe("Hello and Bar");
});

test("whitespace-only text between elements", async () => {
	const wsSource = `
	export default function WhitespaceBetween() {
		@render {
			<ul>
				<li>A</li>
				<li>B</li>
				<li>C</li>
			</ul>
		}
	}
	`;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, wsSource, "client");
	mountComponent(container, component);

	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(3);
	expect(lis[0].textContent).toBe("A");
	expect(lis[1].textContent).toBe("B");
	expect(lis[2].textContent).toBe("C");
});

test("newlines in text content", async () => {
	const nlSource = `
	export default function NewlineText() {
		@render {
			<pre>line1
line2
line3</pre>
		}
	}
	`;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, nlSource, "client");
	mountComponent(container, component);

	let pre = container.querySelector("pre");
	expect(pre?.textContent).toContain("line1");
	expect(pre?.textContent).toContain("line2");
	expect(pre?.textContent).toContain("line3");
});

test("leading and trailing whitespace nodes are trimmed (Svelte 5-style)", async () => {
	const wsSource = `
	export default function WhitespaceTrim() {
		@render {
			<div>
				<span>A</span>
				<span>B</span>
			</div>
		}
	}
	`;

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, wsSource, "client");
	mountComponent(container, component);

	let div = container.querySelector("div");
	// Expect: span, single-space text, span — no leading/trailing whitespace nodes
	expect(div?.childNodes.length).toBe(3);
	expect(div?.childNodes[0].nodeType).toBe(1);
	expect(div?.childNodes[1].nodeType).toBe(3);
	expect(div?.childNodes[1].textContent).toBe(" ");
	expect(div?.childNodes[2].nodeType).toBe(1);
});

test("whitespace trimmed identically on server and client (hydration)", async () => {
	const wsSource = `
	export default function WhitespaceHydrate() {
		@render {
			<ul>
				<li>A</li>
				<li>B</li>
			</ul>
		}
	}
	`;

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, wsSource, "client");
	const serverComponent = await importComponent(import.meta.filename, wsSource, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	let ul = container.querySelector("ul");
	// Inter-child whitespace inside <ul> is insignificant — removed entirely
	expect(ul?.childNodes.length).toBe(2);
	expect(ul?.childNodes[0].nodeType).toBe(1);
	expect(ul?.childNodes[1].nodeType).toBe(1);
});

test("whitespace preserved inside <pre> during hydration", async () => {
	const preSource = `
	export default function PreHydrate() {
		@render {
			<pre>line1
line2
line3</pre>
		}
	}
	`;

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, preSource, "client");
	const serverComponent = await importComponent(import.meta.filename, preSource, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	let pre = container.querySelector("pre");
	// Newlines inside <pre> are preserved verbatim
	expect(pre?.textContent).toBe("line1\nline2\nline3");
});
