// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from "vite-plus/test";
import { t_add_element } from "@torpor/view";
import navigate from "../src/nav/navigate";
import client from "../src/state/client";
import Router from "../src/site/Router";
import type ManifestRoute from "../src/types/ManifestRoute";
import { LAYOUT_ROUTE, PAGE_ROUTE } from "../src/types/RouteType";

type Context = Record<PropertyKey, any>;
type SlotRender = (
	parent: ParentNode,
	anchor: Node | null,
	props?: Record<PropertyKey, any>,
	context?: Context,
) => void;

/**
 * A layout like the compiler emits: clone the incoming context, add to it,
 * and render the slot with the augmented context.
 */
const layoutComponent = (
	parent: ParentNode,
	anchor: Node | null,
	_props: any,
	$context: Context | undefined,
	$slots: Record<string, SlotRender> | undefined,
): void => {
	const context = { ...$context, layoutValue: "from layout" };
	const main = parent.ownerDocument!.createElement("main");
	parent.insertBefore(main, anchor);
	$slots!["_"](main, null, undefined, context);
};

/** A page that reads the context its layout added. */
const pageComponent = (
	parent: ParentNode,
	anchor: Node | null,
	_props: any,
	$context: Context | undefined,
): void => {
	const p = parent.ownerDocument!.createElement("p");
	p.textContent = `value=${$context?.layoutValue ?? "missing"}`;
	t_add_element(p, parent, anchor);
};

const routes: ManifestRoute[] = [
	{
		path: "/blog/_layout",
		type: LAYOUT_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: layoutComponent } }),
		subFolder: undefined,
	},
	{
		path: "/blog",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	},
	{
		path: "/blog/other",
		type: PAGE_ROUTE,
		endPoint: () => Promise.resolve({ default: { component: pageComponent } }),
		subFolder: undefined,
	},
];

beforeEach(() => {
	client.router = new Router();
	client.layoutStack = [];
	client.prefetchedData = {};
	client.prefetchedServerData = {};
	client.viewTransitions = false;
	document.body.innerHTML = '<div id="app"></div>';
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

test("a page receives the context its layout passes to the slot", async () => {
	client.router.addPages(routes);

	const result = await navigate(new URL("http://localhost/blog"));

	expect(result).toEqual({ type: "rendered" });
	expect(document.querySelector("#app")!.textContent).toContain("value=from layout");
});

test("a reused layout's context reaches the next page", async () => {
	client.router.addPages(routes);

	await navigate(new URL("http://localhost/blog"));
	expect(document.querySelector("#app")!.textContent).toContain("value=from layout");

	// The layout is reused (same path) and its slot is refilled: the new page
	// must still see the context the layout added, even though the layout
	// component doesn't run again
	const result = await navigate(new URL("http://localhost/blog/other"));

	expect(result).toEqual({ type: "rendered" });
	expect(document.querySelector("#app")!.textContent).toContain("value=from layout");
});
