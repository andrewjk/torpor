import { afterEach, expect, test, vi } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";
import devTitle, { setDevSlotDepth } from "../../src/dev/titleWarning";

afterEach(() => {
	vi.restoreAllMocks();
});

function watchWarnings() {
	return vi.spyOn(console, "warn").mockImplementation(() => {});
}

test("a child's title alongside its page's warns, naming both", () => {
	const warn = watchWarnings();

	const page = devTitle();
	page.set("Markup | Site");
	const child = devTitle();
	child.set("Site");

	expect(warn).toHaveBeenCalledOnce();
	expect(warn.mock.calls[0][0]).toContain('"Markup | Site" and "Site"');

	// Once per title, however many components set it
	const another = devTitle();
	another.set("Site");
	expect(warn).toHaveBeenCalledOnce();

	another.unset();
	child.unset();
	page.unset();
});

test("a page's title over its layout's doesn't warn", () => {
	const warn = watchWarnings();

	const layout = devTitle();
	layout.set("Site");
	// The page renders in the layout's slot
	const previous = setDevSlotDepth(2);
	const page = devTitle();
	setDevSlotDepth(previous);
	page.set("Docs | Site");

	// Reactive updates re-set it, from outside the slot's render
	page.unset();
	page.set("Markup | Site");

	expect(warn).not.toHaveBeenCalled();

	page.unset();
	layout.unset();
});

test("a page's child that sets a title in the same slot warns", () => {
	const warn = watchWarnings();

	const layout = devTitle();
	layout.set("Site");
	const previous = setDevSlotDepth(2);
	const page = devTitle();
	const child = devTitle();
	setDevSlotDepth(previous);
	page.set("Docs | Site");
	child.set("Code sample");

	expect(warn).toHaveBeenCalledOnce();

	child.unset();
	page.unset();
	layout.unset();
});

test("a title on its own, or after the other is gone, doesn't warn", () => {
	const warn = watchWarnings();

	const first = devTitle();
	first.set("First");
	first.unset();
	const second = devTitle();
	second.set("Second");

	expect(warn).not.toHaveBeenCalled();

	second.unset();
});

test("dev builds track @head titles; production builds don't", () => {
	const parsed = parse(`
export default function X() {
	@head {
		<title>Hello</title>
	}
}
`);
	expect(parsed.ok).toBe(true);
	expect(build(parsed.template!, { dev: true }).code).toContain("t_dev_title()");
	expect(build(parsed.template!).code).not.toContain("t_dev_title");
});
