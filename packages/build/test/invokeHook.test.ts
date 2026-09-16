import { describe, expect, test } from "vite-plus/test";
import type ServerHook from "../src/types/ServerHook";
import type ServerLoadEvent from "../src/types/ServerLoadEvent";
import ServerEvent from "../src/server/ServerEvent";
import invokeHook from "../src/server/invokeHook";

/**
 * A `ServerLoadEvent` built around a `ServerEvent`, like the route pipeline's
 * `buildServerParams` does.
 */
function testEvent(url = "https://example.com/"): ServerLoadEvent {
	const ev = new ServerEvent(new Request(url));
	return {
		url: ev.url,
		params: {},
		appData: {},
		request: ev.request,
		json: () => ev.json(),
		form: async () => ({}),
		query: async () => ({}),
		cookies: ev.cookies,
		session: ev.session,
		flash: ev.flash,
		headers: ev.headers,
		adapter: {},
	};
}

describe("invokeHook", () => {
	test("returns the Response when enter short-circuits", async () => {
		const hook = {
			enter: () => new Response("nope", { status: 302 }),
		} satisfies ServerHook;

		const res = await invokeHook(hook, testEvent());

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(302);
	});

	test("awaits a Promise<Response> return", async () => {
		const hook = {
			enter: async () => new Response("later"),
		} satisfies ServerHook;

		const res = await invokeHook(hook, testEvent());

		expect(res).toBeInstanceOf(Response);
	});

	test("returns undefined when enter returns void", async () => {
		const hook = {
			enter: () => {
				// Do nothing, like a hook that just sets appData
			},
		} satisfies ServerHook;

		const res = await invokeHook(hook, testEvent());

		expect(res).toBeUndefined();
	});

	test("returns undefined when the hook has no enter", async () => {
		const hook = {} satisfies ServerHook;

		const res = await invokeHook(hook, testEvent());

		expect(res).toBeUndefined();
	});

	test("passes the event through so the hook can mutate appData", async () => {
		const hook = {
			enter: ({ appData }: { appData: Record<string, any> }) => {
				appData.user = { name: "test" };
			},
		} satisfies ServerHook;

		const ev = testEvent();
		await invokeHook(hook, ev);

		expect(ev.appData.user).toEqual({ name: "test" });
	});
});
