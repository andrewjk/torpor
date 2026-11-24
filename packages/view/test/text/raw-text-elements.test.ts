import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";
import type ElementNode from "../../src/compile/types/nodes/ElementNode";
import type TemplateNode from "../../src/compile/types/nodes/TemplateNode";
import type TextNode from "../../src/compile/types/nodes/TextNode";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const scriptContent = `const a = { b: 1 };
const s = \`\${a.b}\`;
const p = "C:\\\\temp";`;

const styleContent = `@media (min-width: 1px) {
  p {
    color: red;
  }
}`;

const source = `
export default function RawTextElements() {
	@render {
		<script>${scriptContent}</script>
		<style>${styleContent}</style>
	}
}
`;

function findElement(node: { children: TemplateNode[] }, tagName: string): ElementNode {
	const element = node.children.find(
		(child): child is ElementNode =>
			child.type === "element" && (child as ElementNode).tagName === tagName,
	);
	if (!element) throw new Error(`Missing <${tagName}> element`);
	return element;
}

test("parse keeps script and style contents as raw text", () => {
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);

	const markup = parsed.template!.components[0].markup!;
	for (const [tagName, content] of [
		["script", scriptContent],
		["style", styleContent],
	]) {
		const element = findElement(markup, tagName);
		expect(element.children).toHaveLength(1);
		const text = element.children[0] as TextNode;
		expect(text.raw).toBe(true);
		expect(text.content).toBe(content);
		expect(text.spans).toEqual([]);
	}
});

test("build doesn't interpolate script or style contents", () => {
	const client = build(parse(source).template!).code;
	expect(client).not.toContain("t_fmt");

	const server = build(parse(source).template!, { server: true }).code;
	expect(server).not.toContain("t_fmt");
});

test("mounted script and style contents are preserved exactly", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	expect(container.querySelector("script")!.textContent).toBe(scriptContent);
	expect(container.querySelector("style")!.textContent).toBe(styleContent);
});
