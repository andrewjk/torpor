import { assert, expect, test } from "vitest";
import Router from "../src/site/Router";
import { HOOK_SERVER_ROUTE, LAYOUT_ROUTE, PAGE_ROUTE } from "../src/types/RouteType";

test("router method sorting", () => {
	let r = new Router();
	r.addPage("/posts/[id]", PAGE_ROUTE, async () => {});
	r.addPage("/posts/drafts/[id]", PAGE_ROUTE, async () => {});
	expect(r.routes.map((r) => r.path).join(",")).toBe("/posts/drafts/[id],/posts/[id]");
});

test("router matching", () => {
	let r = new Router();
	r.addPage("/posts", PAGE_ROUTE, async () => {});
	const match = r.match("/posts", new URLSearchParams());
	assert(match, "no match");
	expect(match.params).toBeUndefined();
	assert(match.handler, "no handler");
});

test("router matching with param", () => {
	let r = new Router();
	r.addPage("/posts/[id]", PAGE_ROUTE, async () => {});
	r.addPage("/posts/drafts/[id]", PAGE_ROUTE, async () => {});
	const match = r.match("/posts/5", new URLSearchParams());
	assert(match, "no match");
	assert(match.params, "no params");
	expect(match.params["id"]).toBe("5");
});

test("router matching not found", () => {
	let r = new Router();
	r.addPage("/posts/[id]", PAGE_ROUTE, async () => {});
	r.addPage("/posts/drafts/[id]", PAGE_ROUTE, async () => {});
	const match = r.match("/postss/5", new URLSearchParams());
	expect(match).toBeUndefined();
});

test("router matching layouts", () => {
	let r = new Router();
	r.addPage("/_layout", LAYOUT_ROUTE, async () => {});
	r.addPage("/posts/_layout", LAYOUT_ROUTE, async () => {});
	r.addPage("/posts/[id]", PAGE_ROUTE, async () => {});
	r.addPage("/posts/drafts/[id]", PAGE_ROUTE, async () => {});
	const match = r.match("/posts/5", new URLSearchParams());
	assert(match, "no match");
	assert(match.handler.layouts, "no layouts");
	expect(match.handler.layouts.length).toBe(2);
});

test("router matching hook", () => {
	let r = new Router();
	r.addPage("/_hook/~server", HOOK_SERVER_ROUTE, async () => {});
	r.addPage("/posts/[id]", PAGE_ROUTE, async () => {});
	const match = r.match("/posts/5", new URLSearchParams());
	assert(match, "no match");
	assert(match.handler.serverHook, "no hook");
});

test("router matching base folder", async () => {
	let r = new Router();
	r.addPage("/_hook/~server", HOOK_SERVER_ROUTE, async () => {});
	r.addPage("/_layout", LAYOUT_ROUTE, async () => {});
	r.addPage("/posts/_layout", LAYOUT_ROUTE, async () => {});
	r.addPage("/posts/[id]", PAGE_ROUTE, async () => {});
	r.addPage("/api/posts/[id]", PAGE_ROUTE, async () => {}, "/api");
	r.addPage("/api/_hook/~server", HOOK_SERVER_ROUTE, async () => "api hook", "/api");
	const match = r.match("/api/posts/5", new URLSearchParams());
	assert(match, "no match");
	assert(match.params, "no params");
	expect(match.params["id"]).toBe("5");

	expect(match.handler.path).toBe("/api/posts/[id]");
	assert(match.handler.serverHook, "no hook");
	expect(await match.handler.serverHook()).toBe("api hook");

	expect(match.handler.layouts).toBeUndefined();
});
