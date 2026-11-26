import { expect, test } from "vite-plus/test";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import { LAYOUT_ROUTE, PAGE_ROUTE } from "../src/types/RouteType";
import type ManifestRoute from "../src/types/ManifestRoute";

const template = "<html><head>%COMPONENT_HEAD%</head><body>%COMPONENT_BODY%</body></html>";

const routes: ManifestRoute[] = [
	{
		path: "/_layout",
		type: LAYOUT_ROUTE,
		endPoint: () =>
			Promise.resolve({
				default: {
					component: async (_: unknown, $context: any, slots: any) => ({
						body: `<main>${await slots._(undefined, $context)}</main>`,
						head: "<style id='layout1'>main.torp-layout1 { margin: 0; }</style>",
					}),
				},
			}),
		subFolder: undefined,
	},
	{
		path: "/docs/_layout",
		type: LAYOUT_ROUTE,
		endPoint: () =>
			Promise.resolve({
				default: {
					component: async (_: unknown, $context: any, slots: any) => ({
						body: `<section>${await slots._(undefined, $context)}</section>`,
						head: "",
					}),
				},
			}),
		subFolder: undefined,
	},
	{
		path: "/docs",
		type: PAGE_ROUTE,
		endPoint: () =>
			Promise.resolve({
				default: {
					component: () => ({
						body: "<p>docs</p>",
						head:
							"<style id='docs1'>p.torp-docs1 { color: red; }</style>" +
							"<style id='extra1'>b.torp-extra1 { color: blue; }</style>",
					}),
				},
			}),
		subFolder: undefined,
	},
	{
		path: "/other",
		type: PAGE_ROUTE,
		endPoint: () =>
			Promise.resolve({ default: { component: () => ({ body: "<p>other</p>", head: "" }) } }),
		subFolder: undefined,
	},
];

const preloads = {
	entry: ["/assets/clientEntry-AAAAAAAA.js"],
	routes: {
		"/_layout": ["/assets/_layout-BBBBBBBB.js", "/assets/shared-CCCCCCCC.js"],
		"/docs/_layout": ["/assets/_layout-DDDDDDDD.js"],
		"/docs": ["/assets/_page-EEEEEEEE.js", "/assets/shared-CCCCCCCC.js"],
		"/other": ["/assets/_page-FFFFFFFF.js"],
	},
	styles: {
		entry: [],
		routes: {
			"/_layout": ["/assets/_layout-BBBBBBBB.css"],
			"/docs": ["/assets/_page-EEEEEEEE.css"],
		},
		hashes: {
			"/assets/_layout-BBBBBBBB.css": ["layout1"],
			"/assets/_page-EEEEEEEE.css": ["docs1"],
		},
	},
};

async function render(path: string, base = ""): Promise<string> {
	const load = createServerLoad(new Router().addPages(routes), base, [], false, preloads);
	const response = await load(
		new ServerEvent(new Request(`http://localhost${base}${path}`)),
		template,
	);
	return await response.text();
}

function preloaded(html: string): string[] {
	return [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map((m) => m[1]);
}

test("a page preloads the entry's, its layouts' and its own chunks, in order, once each", async () => {
	const html = await render("/docs");
	expect(preloaded(html)).toEqual([
		"/assets/clientEntry-AAAAAAAA.js",
		"/assets/_layout-BBBBBBBB.js",
		"/assets/shared-CCCCCCCC.js",
		"/assets/_layout-DDDDDDDD.js",
		"/assets/_page-EEEEEEEE.js",
	]);
	// In the head, ahead of the body
	expect(html.indexOf("modulepreload")).toBeLessThan(html.indexOf("</head>"));
});

test("a page only preloads the layouts it uses", async () => {
	expect(preloaded(await render("/other"))).toEqual([
		"/assets/clientEntry-AAAAAAAA.js",
		"/assets/_layout-BBBBBBBB.js",
		"/assets/shared-CCCCCCCC.js",
		"/assets/_page-FFFFFFFF.js",
	]);
});

test("preload links get the site's base path", async () => {
	expect(preloaded(await render("/other", "/app"))[0]).toBe("/app/assets/clientEntry-AAAAAAAA.js");
});

test("no preload links without build preloads (e.g. in dev)", async () => {
	const load = createServerLoad(new Router().addPages(routes));
	const response = await load(new ServerEvent(new Request("http://localhost/docs")), template);
	expect(await response.text()).not.toContain("modulepreload");
});

function stylesheets(html: string): string[] {
	return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
}

test("a page links its layouts' and its own stylesheets", async () => {
	const html = await render("/docs");
	expect(stylesheets(html)).toEqual(["/assets/_layout-BBBBBBBB.css", "/assets/_page-EEEEEEEE.css"]);
	// Ahead of the scripts, so the styles start loading first
	expect(html.indexOf('rel="stylesheet"')).toBeLessThan(html.indexOf("modulepreload"));
});

test("inline styles a linked stylesheet contains are left out, others stay", async () => {
	const html = await render("/docs");
	expect(html).not.toContain("<style id='layout1'>");
	expect(html).not.toContain("<style id='docs1'>");
	expect(html).toContain("<style id='extra1'>b.torp-extra1 { color: blue; }</style>");
});

test("without build preloads, inline styles are kept", async () => {
	const load = createServerLoad(new Router().addPages(routes));
	const html = await (
		await load(new ServerEvent(new Request("http://localhost/docs")), template)
	).text();
	expect(html).toContain("<style id='docs1'>");
	expect(stylesheets(html)).toEqual([]);
});

test("in dev, inline styles are tagged with their Vite module id", async () => {
	const load = createServerLoad(new Router().addPages(routes), "", [], true);
	const html = await (
		await load(new ServerEvent(new Request("http://localhost/docs")), template)
	).text();
	expect(html).toContain("<style id='docs1' data-vite-dev-id='docs1.css'>");
	expect(html).toContain("<style id='layout1' data-vite-dev-id='layout1.css'>");
});
