import { build, parse } from "@torpor/view/compile";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { UnpluginOptions } from "unplugin";
import { expect, test } from "vite-plus/test";
import { unpluginFactory } from "../src/index";

const source = readFileSync(path.resolve("test/components/Styled.torp"), "utf8");
const parsed = parse(source);
const built = build(parsed.template!, { server: false });
const style = built.styles[0];
const styleId = `${style.hash}.css`;

function createPlugin(): UnpluginOptions {
	return unpluginFactory({ test: true }, { framework: "vite", versions: {} }) as UnpluginOptions;
}

// The plugin remembers a style only as a side effect of transforming its
// owner. After Vite's dep optimizer invalidates the module graph and reloads,
// a browser request for the style can arrive before the owner is transformed
// again -- a fresh plugin instance stands in for that cold graph here.

test("scoped style -- resolveId re-derives the CSS from source", () => {
	const plugin = createPlugin();
	const resolveId = plugin.resolveId as (id: string) => string | undefined;

	expect(resolveId(styleId)).toBe(styleId);
});

test("scoped style -- load re-derives the CSS from source", () => {
	const plugin = createPlugin();
	const load = plugin.load as (id: string) => string | undefined;

	expect(load(styleId)).toBe(style.style);
});

test("scoped style -- an unknown hash stays unresolved", () => {
	const plugin = createPlugin();
	const resolveId = plugin.resolveId as (id: string) => string | undefined;

	expect(resolveId("zzzzzzzz.css")).toBeUndefined();
});
