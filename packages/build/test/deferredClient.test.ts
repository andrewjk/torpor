// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from "vite-plus/test";
import loadData from "../src/nav/loadData";
import ok from "../src/response/ok";
import client from "../src/state/client";
import type RouteHandler from "../src/types/RouteHandler";
import { PAGE_ROUTE } from "../src/types/RouteType";

const component = () => ({ body: "", head: "" });

const handler: RouteHandler = {
	path: "/posts",
	type: PAGE_ROUTE,
	endPoint: () => Promise.resolve({ default: { component } }),
	serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
};

beforeEach(() => {
	client.layoutStack = [];
	client.prefetchedData = {};
	client.prefetchedServerData = {};
	document.body.innerHTML = "";
	delete (globalThis as { __torporDeferred?: unknown }).__torporDeferred;
});

test("a navigation mounts with a promise for each deferred server value", async () => {
	const encoder = new TextEncoder();
	let controller!: ReadableStreamDefaultController<Uint8Array>;
	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			controller = c;
		},
	});
	// jsdom's ReadableStream starts on a microtask
	await Promise.resolve();
	const fetchMock = vi.fn(
		async () =>
			new Response(stream, {
				headers: { "Content-Type": "application/x-ndjson" },
			}),
	);
	vi.stubGlobal("fetch", fetchMock);

	try {
		controller.enqueue(
			encoder.encode(
				JSON.stringify({
					type: "data",
					loads: [{}],
					deferred: [{ id: "d0", index: 0, path: ["comments"] }],
				}) + "\n",
			),
		);

		const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], undefined);
		expect(result?.data.comments).toBeInstanceOf(Promise);

		controller.enqueue(
			encoder.encode(
				JSON.stringify({ type: "value", id: "d0", value: ["first", "second"] }) + "\n",
			),
		);
		expect(await result?.data.comments).toEqual(["first", "second"]);
		controller.close();
	} finally {
		vi.unstubAllGlobals();
	}
});

test("a deferred stream error rejects the value", async () => {
	const encoder = new TextEncoder();
	let controller!: ReadableStreamDefaultController<Uint8Array>;
	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			controller = c;
		},
	});
	// jsdom's ReadableStream starts on a microtask
	await Promise.resolve();
	vi.stubGlobal(
		"fetch",
		vi.fn(
			async () =>
				new Response(stream, {
					headers: { "Content-Type": "application/x-ndjson" },
				}),
		),
	);

	try {
		controller.enqueue(
			encoder.encode(
				JSON.stringify({
					type: "data",
					loads: [{}],
					deferred: [{ id: "d0", index: 0, path: ["comments"] }],
				}) + "\n",
			),
		);
		const result = await loadData(handler, {}, "/posts", new URLSearchParams(), [], undefined);

		controller.enqueue(
			encoder.encode(JSON.stringify({ type: "error", id: "d0", message: "db down" }) + "\n"),
		);
		await expect(result?.data.comments).rejects.toThrow("db down");
		controller.close();
	} finally {
		vi.unstubAllGlobals();
	}
});

test("a page can opt out of the data request when layouts are reused", async () => {
	const fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	try {
		const result = await loadData(
			{
				path: "/posts",
				type: PAGE_ROUTE,
				endPoint: () => Promise.resolve({ default: {} }),
				serverHooks: [() => Promise.resolve({ default: { enter: async () => {} } })],
			},
			{},
			"/posts",
			new URLSearchParams(),
			[],
			{ serverData: false },
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(result?.data).toEqual({});
	} finally {
		vi.unstubAllGlobals();
	}
});

test("serverData: false still requests data when the page has a server load", async () => {
	const fetchMock = vi.fn(async () => Response.json({ loads: [{}] }));
	vi.stubGlobal("fetch", fetchMock);
	try {
		await loadData(
			{
				...handler,
				serverEndPoint: () => Promise.resolve({ default: { load: async () => {} } }),
			},
			{},
			"/posts",
			new URLSearchParams(),
			[],
			{ serverData: false },
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	} finally {
		vi.unstubAllGlobals();
	}
});

test("a client load keeps promise-valued data", async () => {
	const later = Promise.resolve(["client"]);
	const result = await loadData(
		{ path: "/posts", type: PAGE_ROUTE, endPoint: () => Promise.resolve({ default: {} }) },
		{},
		"/posts",
		new URLSearchParams(),
		[],
		{ load: async () => ok({ now: "here", later }) },
	);

	expect(result?.data.now).toBe("here");
	expect(result?.data.later).toBeInstanceOf(Promise);
	expect(await result?.data.later).toEqual(["client"]);
});

test("embedded server data uses the inline deferred store", async () => {
	(globalThis as { __torporDeferred?: unknown }).__torporDeferred = {
		get: (id: string) => Promise.resolve(`hydrated:${id}`),
	};
	document.body.innerHTML =
		'<script type="application/json" id="t-server-data">' +
		JSON.stringify({
			loads: [{}],
			deferred: [{ id: "d0", index: 0, path: ["comments"] }],
		}) +
		"</script>";

	const result = await loadData(
		{ path: "/posts", type: PAGE_ROUTE, endPoint: () => Promise.resolve({ default: {} }) },
		{},
		"/posts",
		new URLSearchParams(),
		[],
		undefined,
	);

	expect(await result?.data.comments).toBe("hydrated:d0");
});
