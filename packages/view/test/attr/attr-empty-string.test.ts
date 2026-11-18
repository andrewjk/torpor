import { getByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AttrEmptyString() {
	@render {
		<img src="x.png" alt="" data-testid="static">
		<img src="x.png" alt={""} data-testid="dynamic">
	}
}
`;

test("empty string attribute -- server render", async () => {
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body } = await serverComponent();

	// `alt=""` is meaningful HTML (decorative image) and must not be escaped
	// into `alt="&quot;&quot;"`
	expect(body).toContain('alt=""');
	expect(body).not.toContain("&quot;");
	expect(body.match(/<img[^>]+data-testid="static"[^>]*>/)?.[0]).toBe(
		'<img src="x.png" alt="" data-testid="static">',
	);
	// An empty reactive value must not drop the attribute either
	expect(body.match(/<img[^>]+data-testid="dynamic"[^>]*>/)?.[0]).toBe(
		'<img src="x.png" alt="" data-testid="dynamic">',
	);
});

test("empty string attribute -- client mount", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(getByTestId(container, "static")).toHaveAttribute("alt", "");
	expect(getByTestId(container, "dynamic")).toHaveAttribute("alt", "");
});

test("empty string attribute -- hydration", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent);

	expect(getByTestId(container, "static")).toHaveAttribute("alt", "");
	expect(getByTestId(container, "dynamic")).toHaveAttribute("alt", "");
});
