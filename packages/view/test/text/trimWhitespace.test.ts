import { expect, test } from "vitest";
import { build } from "../../src/compile";
import { parse } from "../../src/compile";
import trimWhitespace from "../../src/compile/utils/trimWhitespace";
import { control, el, root, text } from "../helpers";

test("removes pure-whitespace nodes at the start and end of a container", () => {
	const tree = root([
		text("\n\t"),
		el("div", [], [text("A")]),
		text("\n\t"),
		el("div", [], [text("B")]),
		text("\n"),
	]);

	trimWhitespace(tree);

	expect(tree.children).toEqual([
		el("div", [], [text("A")]),
		text(" "),
		el("div", [], [text("B")]),
	]);
});

test("collapses whitespace between siblings to a single space", () => {
	const tree = root([el("span", [], [text("a")]), text("\n\t\t\t"), el("span", [], [text("b")])]);

	trimWhitespace(tree);

	expect(tree.children).toEqual([
		el("span", [], [text("a")]),
		text(" "),
		el("span", [], [text("b")]),
	]);
	expect((tree.children[1] as any).content).toBe(" ");
});

test("removes inter-child whitespace inside table and list containers", () => {
	const tree = root([
		el("tr", [], [
			text("\n\t"),
			el("td", [], [text("A")]),
			text("\n\t"),
			el("td", [], [text("B")]),
			text("\n"),
		]),
		el("ul", [], [
			text("\n"),
			el("li", [], [text("x")]),
			text("\n"),
			el("li", [], [text("y")]),
			text("\n"),
		]),
	]);

	trimWhitespace(tree);

	const tr = tree.children[0] as any;
	expect(tr.children).toEqual([el("td", [], [text("A")]), el("td", [], [text("B")])]);
	const ul = tree.children[1] as any;
	expect(ul.children).toEqual([el("li", [], [text("x")]), el("li", [], [text("y")])]);
});

test("removes whitespace-only children entirely when only whitespace is present", () => {
	const tree = root([text("\n\t\t")]);

	trimWhitespace(tree);

	expect(tree.children).toEqual([]);
});

test("leaves mixed text nodes untouched", () => {
	const tree = root([text("Hello world")]);

	trimWhitespace(tree);

	expect(tree.children).toEqual([text("Hello world")]);
	expect((tree.children[0] as any).content).toBe("Hello world");
});

test("preserves whitespace inside <pre>", () => {
	const tree = root([
		el("div", [], [text("\n"), el("pre", [], [text("\n\tline1\n\tline2\n")]), text("\n")]),
	]);

	trimWhitespace(tree);

	const div = tree.children[0] as any;
	// Outer whitespace around <pre> is trimmed
	expect(div.children[0]).toEqual(el("pre", [], [text("\n\tline1\n\tline2\n")]));
	// Inner whitespace of <pre> is untouched
	expect(div.children[0].children[0].content).toBe("\n\tline1\n\tline2\n");
});

test("preserves whitespace inside <textarea> and <code>", () => {
	const tree = root([
		el("textarea", [], [text("\n  a\n  b\n")]),
		text("\n"),
		el("code", [], [text("  x  ")]),
	]);

	trimWhitespace(tree);

	// root level: textarea, " ", code (the whitespace between siblings collapsed)
	const textarea = tree.children[0] as any;
	const codeEl = tree.children[2] as any;
	expect(textarea.children[0].content).toBe("\n  a\n  b\n");
	expect(codeEl.children[0].content).toBe("  x  ");
});

test("trims inside control block bodies", () => {
	const tree = root([
		control("@for group", "", [
			control("@for", "(item of items)", [text("\n\t\t"), el("li", [], [text("x")]), text("\n\t")]),
		]),
	]);

	trimWhitespace(tree);

	const forBody = (tree.children[0] as any).children[0].children;
	expect(forBody).toEqual([el("li", [], [text("x")])]);
});

test("is idempotent", () => {
	const tree = root([
		text("\n"),
		el("span", [], [text("a")]),
		text("\n\t"),
		el("span", [], [text("b")]),
		text("\n"),
	]);

	trimWhitespace(tree);
	const once = JSON.parse(JSON.stringify(tree.children));
	trimWhitespace(tree);
	const twice = JSON.parse(JSON.stringify(tree.children));

	expect(twice).toEqual(once);
});

test("build() trims by default", () => {
	const source = `
export default function T() {
	@render {
		<div>
			<span>A</span>
			<span>B</span>
		</div>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	build(parsed.template!);
	const markup = parsed.template!.components[0].markup!;
	const div = markup.children.find((c: any) => c.tagName === "div") as any;
	// span, " ", span — no leading/trailing whitespace nodes
	expect(div.children.length).toBe(3);
	expect(div.children[0].tagName).toBe("span");
	expect(div.children[1].content).toBe(" ");
	expect(div.children[2].tagName).toBe("span");
});

test("build() with preserveWhitespace leaves nodes untouched", () => {
	const source = `
export default function T() {
	@render {
		<div>
			<span>A</span>
			<span>B</span>
		</div>
	}
}
`;
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	build(parsed.template!, { preserveWhitespace: true });
	const markup = parsed.template!.components[0].markup!;
	const div = markup.children.find((c: any) => c.tagName === "div") as any;
	// original whitespace nodes are preserved (not removed/collapsed)
	expect(div.children.length).toBe(5);
	expect(div.children[0].type).toBe("text");
	expect(div.children[1].tagName).toBe("span");
	expect(div.children[2].type).toBe("text");
	expect(div.children[3].tagName).toBe("span");
	expect(div.children[4].type).toBe("text");
});
