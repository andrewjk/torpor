import { expect, test } from "vite-plus/test";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import { PAGE_ROUTE } from "../src/types/RouteType";
import type ManifestRoute from "../src/types/ManifestRoute";

// A layout that branches on `$page.meta`, the way a site header would for
// pages that declare `meta: { bare: true }`
const layoutComponent = async (_props: any, $context: any, slots?: Record<string, any>) => {
	const slot = slots?._;
	const inner = slot ? await slot(undefined, $context) : "";
	return {
		body: `<p>bare=${String($context.$page?.meta?.bare ?? false)}</p>${inner}`,
		head: "",
	};
};

const pageComponent = () => ({ body: "<p>page</p>", head: "" });

const routes: ManifestRoute[] = [
	{
		path: "/_layout",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: layoutComponent } }),
		subFolder: undefined,
	},
	{
		path: "/booking",
		type: PAGE_ROUTE,
		endPoint: () =>
			Promise.resolve({ default: { component: pageComponent, meta: { bare: true } } }),
		subFolder: undefined,
	},
	{
		path: "/",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	},
];

const template = `<html><head></head><body><div id="app">%COMPONENT_BODY%</div></body></html>`;

test("a layout sees the page's declared meta as $page.meta", async () => {
	const load = createServerLoad(new Router().addPages(routes));
	const res = await load(new ServerEvent(new Request("http://localhost/booking")), template);

	const html = await res.text();
	expect(html).toContain("bare=true");
});

test("a page without meta leaves $page.meta undefined", async () => {
	const load = createServerLoad(new Router().addPages(routes));
	const res = await load(new ServerEvent(new Request("http://localhost/")), template);

	const html = await res.text();
	expect(html).toContain("bare=false");
});
