import { expect, test } from "vite-plus/test";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type ServerHook from "../src/types/ServerHook";
import { HOOK_SERVER_ROUTE, PAGE_ROUTE, SERVER_ROUTE } from "../src/types/RouteType";

const template = `<html><head></head><body><div id="app">%COMPONENT_BODY%</div></body></html>`;

const component = () => ({ body: `<p>the page</p>`, head: "" });

const hook: ServerHook = {
	enter: () => {
		// No response returned, so the request carries on
	},
};

const apiModule = { default: { get: async () => new Response("api") } };

test("a cancelled request doesn't strand the cached route module", async () => {
	let calls = 0;
	let settleFirst!: (mod: any) => void;
	const routes: ManifestRoute[] = [
		{
			path: "/api",
			type: SERVER_ROUTE,
			endPoint: () => {
				calls++;
				// The first load stands in for workerd's cross-request promise
				// handling: the request that started it is cancelled, so the
				// promise it got back can never settle
				if (calls === 1) {
					return new Promise((resolve) => {
						settleFirst = resolve;
					});
				}
				return Promise.resolve(apiModule);
			},
			subFolder: undefined,
		},
	];
	const load = createServerLoad(new Router().addPages(routes));

	// The first request starts the module load and is then abandoned
	const abandoned = load(new ServerEvent(new Request("http://localhost/api")), template);

	// A later request must call the loader again rather than await the
	// stranded promise (caching the promise hangs here)
	const res = await load(new ServerEvent(new Request("http://localhost/api")), template);
	expect(res.status).toBe(200);
	expect(await res.text()).toBe("api");
	expect(calls).toBe(2);

	// The abandoned request still completes, with its own load's result
	settleFirst(apiModule);
	expect((await abandoned).status).toBe(200);
});

test("a failed module load isn't cached, so the next request can retry", async () => {
	let calls = 0;
	const routes: ManifestRoute[] = [
		{
			path: "/api",
			type: SERVER_ROUTE,
			endPoint: () => {
				calls++;
				if (calls === 1) return Promise.reject(new Error("transient"));
				return Promise.resolve(apiModule);
			},
			subFolder: undefined,
		},
	];
	const load = createServerLoad(new Router().addPages(routes));

	// An api endpoint's failure is rethrown rather than rendered as an error
	// page
	await expect(
		load(new ServerEvent(new Request("http://localhost/api")), template),
	).rejects.toThrow("transient");

	const res = await load(new ServerEvent(new Request("http://localhost/api")), template);
	expect(res.status).toBe(200);
	expect(await res.text()).toBe("api");
	expect(calls).toBe(2);
});

test("a warm route reuses the loaded module and hooks", async () => {
	let moduleCalls = 0;
	let hookLoads = 0;
	const routes: ManifestRoute[] = [
		{
			path: "/_hook/~server",
			type: HOOK_SERVER_ROUTE,
			endPoint: () => {
				hookLoads++;
				return Promise.resolve({ default: hook });
			},
			subFolder: undefined,
		},
		{
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => {
				moduleCalls++;
				return Promise.resolve({ default: { component } });
			},
			subFolder: undefined,
		},
	];
	const load = createServerLoad(new Router().addPages(routes));

	const first = await load(new ServerEvent(new Request("http://localhost/posts")), template);
	const second = await load(new ServerEvent(new Request("http://localhost/posts")), template);
	expect(first.status).toBe(200);
	expect(second.status).toBe(200);
	expect(moduleCalls).toBe(1);
	expect(hookLoads).toBe(1);
});

test("a cancelled request doesn't strand the route's server hooks", async () => {
	let hookLoads = 0;
	let settleFirst!: (mod: any) => void;
	const routes: ManifestRoute[] = [
		{
			path: "/_hook/~server",
			type: HOOK_SERVER_ROUTE,
			endPoint: () => {
				hookLoads++;
				// The first request is cancelled before the hook module settles
				if (hookLoads === 1) {
					return new Promise((resolve) => {
						settleFirst = resolve;
					});
				}
				return Promise.resolve({ default: hook });
			},
			subFolder: undefined,
		},
		{
			path: "/posts",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
	];
	const load = createServerLoad(new Router().addPages(routes));

	// Start the hooks load, then abandon the request
	const abandoned = load(new ServerEvent(new Request("http://localhost/posts")), template);

	// A later request must load the hooks again rather than await the
	// stranded promise (caching the promise hangs here)
	const res = await load(new ServerEvent(new Request("http://localhost/posts")), template);
	expect(res.status).toBe(200);
	expect(hookLoads).toBe(2);

	// The abandoned request still completes once its own load settles
	settleFirst({ default: hook });
	expect((await abandoned).status).toBe(200);
});
