import { expect, test } from "vite-plus/test";
import { DATA_REQUEST_HEADER } from "../src/dataRequest";
import { splitDeferred } from "../src/deferred";
import { INTERNAL_RESPONSE_DEFERRED } from "../src/response/internal";
import ok from "../src/response/ok";
import { rawResponseBody } from "../src/response/read";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type ManifestRoute from "../src/types/ManifestRoute";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import { PAGE_ROUTE, PAGE_SERVER_ROUTE } from "../src/types/RouteType";

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const component = () => ({ body: "", head: "" });

function slowRoutes(load: PageServerEndPoint["load"]): ManifestRoute[] {
	return [
		{
			path: "/slow",
			type: PAGE_ROUTE,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
		{
			path: "/slow/~server",
			type: PAGE_SERVER_ROUTE,
			endPoint: () => Promise.resolve({ default: { load } }),
			subFolder: undefined,
		},
	];
}

function dataEvent(): ServerEvent {
	return new ServerEvent(
		new Request("http://localhost/slow/~server", {
			headers: { [DATA_REQUEST_HEADER]: "1" },
		}),
	);
}

async function readAll(response: Response): Promise<string> {
	return await response.text();
}

test("ok() splits deferred promise values out of the JSON body", async () => {
	const later = deferred<number>();
	const res = ok({ now: 1, later: later.promise });
	later.resolve(2);

	expect(await res.json()).toEqual({ now: 1 });
	expect(rawResponseBody(res)?.later).toBe(later.promise);
	const entries = (res as Response & { [INTERNAL_RESPONSE_DEFERRED]?: { path: unknown[] }[] })[
		INTERNAL_RESPONSE_DEFERRED
	];
	expect(entries?.map((entry) => entry.path)).toEqual([["later"]]);
});

test("splitDeferred walks nested objects and arrays", () => {
	const promise = Promise.resolve("value");
	const { critical, entries } = splitDeferred({
		now: true,
		nested: { later: promise },
		list: [1, promise],
	});

	expect(critical).toEqual({ now: true, nested: {}, list: [1, undefined] });
	expect(entries.map((entry) => entry.path)).toEqual([
		["nested", "later"],
		["list", 1],
	]);
});

test("a data request streams deferred values after the critical frame", async () => {
	const later = deferred<string>();
	const load = createServerLoad(
		new Router().addPages(slowRoutes(async () => ok({ now: "here", later: later.promise }))),
	);
	const response = await load(dataEvent(), "%COMPONENT_BODY%");

	expect(response.headers.get("Content-Type")).toContain("application/x-ndjson");
	const reader = response.body!.getReader();
	const decoder = new TextDecoder();

	// The first frame has the critical data and names the deferred path; the
	// promise is still in flight
	const first = decoder.decode((await reader.read()).value);
	expect(first).toContain('"now":"here"');
	expect(first).toContain('"deferred":[{"id":"d0","index":0,"path":["later"]}]');

	later.resolve("eventually");
	const rest = await readAll(new Response(readerAsStream(reader)));
	expect(rest).toContain('"type":"value"');
	expect(rest).toContain('"id":"d0"');
	expect(rest).toContain('"value":"eventually"');
});

test("a rejected deferred value streams an error frame", async () => {
	const later = deferred<string>();
	const loadPromise = createServerLoad(
		new Router().addPages(slowRoutes(async () => ok({ now: "here", later: later.promise }))),
	);
	const response = await loadPromise(dataEvent(), "%COMPONENT_BODY%");
	later.reject(new Error("boom"));

	const body = await readAll(response);
	expect(body).toContain('"type":"error"');
	expect(body).toContain('"message":"boom"');
});

/** Adapts an in-progress reader to a Response so `text()` can drain the rest. */
function readerAsStream(
	reader: ReadableStreamDefaultReader<Uint8Array>,
): ReadableStream<Uint8Array> {
	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) controller.close();
			else controller.enqueue(value);
		},
	});
}
