import "@testing-library/jest-dom/vitest";
import { afterEach, expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

afterEach(() => {
	document.body.innerHTML = "";
});

const CODE_SAMPLE = `<p>The count is 0.</p>
<button onclick={() => count++}>Increment</button>`;

const source = `
export default function TextEscape($props: { code: string }) {
	@render {
		<pre><code>{$props.code}</code></pre>
		<p id="lit">{"<b>bold</b>"}</p>
	}
}
`;

test("server render escapes html in text interpolations", async () => {
	const state = $watch({ code: CODE_SAMPLE });

	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body } = serverComponent(state);

	// The interpolated value must not be parseable as markup
	expect(body).toContain("&lt;button");
	expect(body).not.toContain("<button");

	// String literals inside expressions are escaped exactly once
	expect(body).toContain("&lt;b&gt;bold&lt;/b&gt;");
	expect(body).not.toContain("&amp;lt;");
});

test("hydrated component shows code sample as text", async () => {
	const state = $watch({ code: CODE_SAMPLE });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, state);

	const code = container.querySelector("code")!;
	// No real elements may be created from the code sample
	expect(code.querySelectorAll("button, p, b").length).toBe(0);
	expect(code.textContent).toContain("<p>The count is 0.</p>");
	expect(code.textContent).toContain("<button");

	// The string literal is rendered as text, not markup
	const lit = container.querySelector("#lit")!;
	expect(lit.querySelectorAll("b").length).toBe(0);
	expect(lit).toHaveTextContent("<b>bold</b>");
});

test("mounted component shows code sample as text", async () => {
	const state = $watch({ code: CODE_SAMPLE });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, state);

	const code = container.querySelector("code")!;
	expect(code.querySelectorAll("button, p, b").length).toBe(0);
	expect(code.textContent).toContain("<button");
});
