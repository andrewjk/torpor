import { expect, test } from "vite-plus/test";
import parse from "../../src/compile/parse";
import type ElementNode from "../../src/compile/types/nodes/ElementNode";
import $watch from "../../src/watch/$watch";
import buildHtml from "../buildHtml";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// Quoted attributes are static strings (braces and `${}` are literal); only a
// whole `{expression}` value or a backtick template literal is reactive.
const source = [
	"export default function AttributeValueSyntax($props: { name: string }) {",
	"\t@render {",
	"\t\t<div",
	"\t\t\tdata-json='{\"a\":1}'",
	"\t\t\tdata-template='${literal}'",
	'\t\t\tdata-class="static {braces}"',
	"\t\t\ttitle=`hello ${$props.name}`",
	"\t\t\tclass={$props.name}",
	"\t\t></div>",
	"\t}",
	"}",
].join("\n");

test("attribute value syntax -- parse", () => {
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);

	const div = parsed.template!.components[0].markup!.children.find(
		(node): node is ElementNode =>
			node.type === "element" && (node as ElementNode).tagName === "div",
	)!;
	const attributes = Object.fromEntries(
		div.attributes.map((attribute) => [attribute.name, attribute]),
	);

	// Quoted values are static, even when they contain braces or `${`
	expect(attributes["data-json"].value).toBe("'{\"a\":1}'");
	expect(attributes["data-json"].reactive).toBe(false);
	expect(attributes["data-template"].reactive).toBe(false);
	expect(attributes["data-class"].reactive).toBe(false);

	// A backtick value is a template literal expression
	expect(attributes["title"].value).toBe("`hello ${$props.name}`");
	expect(attributes["title"].reactive).toBe(true);
	expect(attributes["title"].fullyReactive).toBe(true);
	expect(attributes["class"].fullyReactive).toBe(true);
});

function check(container: HTMLElement) {
	const div = container.querySelector("div") as HTMLElement;
	expect(div).not.toBeNull();
	expect(div.getAttribute("data-json")).toBe('{"a":1}');
	expect(div.getAttribute("data-template")).toBe("${literal}");
	expect(div.getAttribute("data-class")).toBe("static {braces}");
	expect(div.getAttribute("title")).toBe("hello Torpor");
	expect(div.getAttribute("class")).toBe("Torpor");
}

test("attribute value syntax -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $watch({ name: "Torpor" }));

	check(container);
});

test("attribute value syntax -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $watch({ name: "Torpor" }));

	check(container);
});

test("attribute value syntax -- server", async () => {
	const html = await buildHtml(source, { name: "Torpor" });

	expect(html).toContain('data-json="{&quot;a&quot;:1}"');
	expect(html).toContain('data-template="${literal}"');
	expect(html).toContain('data-class="static {braces}"');
	expect(html).toContain('title="hello Torpor"');
	expect(html).toContain('class="Torpor"');
});
