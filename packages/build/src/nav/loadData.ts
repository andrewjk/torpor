import { type DeferredMeta, setAtPath } from "../deferred.ts";
import { DATA_REUSE_HEADER, DATA_REQUEST_HEADER } from "../dataRequest.ts";
import { readResponseBody } from "../response/read.ts";
import { getBasePath } from "../site/basePath";
import type LayoutPath from "../types/LayoutPath";
import type PageEndPoint from "../types/PageEndPoint";
import type RouteHandler from "../types/RouteHandler";
import client from "../state/client";

/**
 * The result of loading a route's data. `error` is set when a load function
 * returned an error response (redirects excluded) -- the caller renders the
 * error page instead of the route.
 */
export type LoadDataResult = {
	data: Record<string, any>;
	error?: {
		status: number;
		message: string;
	};
};

/**
 * Loads a route's data for a client-side navigation.
 *
 * One request (`GET <page url>/~server` with the data header) returns the
 * server data for the page and all of its layouts, with hooks running once
 * against the page url. The client then runs its own load functions (layout
 * by layout, then the page), merging each route's fresh server data in the
 * same order the server render does.
 */
export default async function loadData(
	handler: RouteHandler,
	params: Record<string, string>,
	path: string,
	query: URLSearchParams,
	newLayoutStack: LayoutPath[],
	clientEndPoint: PageEndPoint | undefined,
	prefetch = false,
): Promise<LoadDataResult | void> {
	let data = {};

	// Work out up front which layouts are already rendered (their data is
	// reused), so the data request can skip loading them. A prefetch also skips
	// their server loads (they're already in the client stack) but must not
	// adopt their live slot regions: it may never be followed by a navigation
	const layoutStack = client.layoutStack;
	const layouts = (handler.layouts ?? []).map((layout, index) => {
		let layoutPath = layout.path;
		for (let key in params) {
			layoutPath = layoutPath.replace(`[${key}]`, params[key]);
		}
		const previous = layoutStack.at(index);
		const rendered = previous?.path === layoutPath;
		const reuse = !prefetch && rendered;
		return { layout, index, layoutPath, previous, rendered, reuse };
	});

	// A page can opt out of the data request when it has no server load of its
	// own and every layout is already rendered (e.g. a tab switch under a
	// session hook that doesn't gate access). Its client load still runs.
	const skipServerData =
		clientEndPoint?.serverData === false &&
		!handler.serverEndPoint &&
		layouts.every((layout) => layout.rendered);

	// One request for all the (non-reused) server data
	const server = skipServerData
		? {}
		: await loadServerData(
				handler,
				path,
				query,
				layouts.filter((l) => l.rendered).map((l) => l.layoutPath),
				prefetch,
			);
	if (server === undefined) {
		// A load redirected: the client can't follow it through fetch, so the
		// caller falls back to a full page load
		return;
	}
	if ("error" in server) {
		return { data, error: server.error };
	}

	for (const { layout, index, layoutPath, previous, rendered, reuse } of layouts) {
		const stackLayout: LayoutPath = {
			path: layoutPath,
			data: {},
			reuse,
			slotRegion: null,
		};

		if (rendered && previous) {
			// The layout is already rendered: keep its data. Only a real
			// navigation reuses its slot region; a prefetch must leave it alone
			// (and not run its client load again)
			if (reuse) stackLayout.slotRegion = previous.slotRegion;
			Object.assign(stackLayout.data, previous.data);
		} else {
			// A new layout: run its client load (its server data already
			// arrived in the single request)
			const layoutEndPoint: PageEndPoint | undefined = (await layout.endPoint())?.default;
			const response = await runClientLoad(
				layoutEndPoint,
				clientLocation(layoutPath),
				query,
				params,
				stackLayout.data,
				prefetch,
			);
			if (response) {
				if (isRedirect(response)) return;
				return { data, error: await errorOf(response) };
			}
			const serverData = server.loads?.[index];
			if (serverData) Object.assign(stackLayout.data, serverData);
		}

		Object.assign(data, stackLayout.data);
		newLayoutStack.push(stackLayout);
	}

	// The page's client load, then its server data
	const response = await runClientLoad(
		clientEndPoint,
		clientLocation(path),
		query,
		params,
		data,
		prefetch,
	);
	if (response) {
		if (isRedirect(response)) return;
		return { data, error: await errorOf(response) };
	}
	const pageServerData = server.loads?.[handler.layouts?.length ?? 0];
	if (pageServerData) Object.assign(data, pageServerData);

	return { data };
}

type ServerData = {
	loads?: (Record<string, any> | null)[];
	/** Promise-valued properties streamed after the critical loads. */
	deferred?: DeferredMeta[];
};

type ServerDataFrame = {
	type?: string;
	id?: string;
	value?: unknown;
	message?: string;
} & ServerData;

/**
 * A request-local registry of deferred promises. Values arrive after the first
 * frame (client navigation) or in inline scripts (initial hydration), and
 * resolve the promises already placed in the page's `data`.
 */
class DeferredStore {
	#entries = new Map<
		string,
		{
			promise: Promise<unknown>;
			resolve: (value: unknown) => void;
			reject: (error: unknown) => void;
		}
	>();

	get(id: string): Promise<unknown> {
		let entry = this.#entries.get(id);
		if (!entry) {
			let resolve!: (value: unknown) => void;
			let reject!: (error: unknown) => void;
			const promise = new Promise<unknown>((res, rej) => {
				resolve = res;
				reject = rej;
			});
			// A prefetch (or a navigation the user leaves) may never read the
			// promise; don't let its rejection surface as unhandled
			promise.catch(() => {});
			entry = { promise, resolve, reject };
			this.#entries.set(id, entry);
		}
		return entry.promise;
	}

	resolve(id: string, value: unknown): void {
		const entry = this.#entries.get(id);
		if (!entry) return;
		this.#entries.delete(id);
		entry.resolve(value);
	}

	reject(id: string, error: unknown): void {
		const entry = this.#entries.get(id);
		if (!entry) return;
		this.#entries.delete(id);
		entry.reject(error instanceof Error ? error : new Error(String(error)));
	}

	rejectAll(error: unknown): void {
		for (const id of this.#entries.keys()) {
			this.reject(id, error);
		}
	}

	/** Places a promise for each deferred entry into the load that owns it. */
	attach(server: ServerData, get: (id: string) => Promise<unknown>): ServerData {
		for (const entry of server.deferred ?? []) {
			const load = server.loads?.[entry.index];
			if (!load) continue;
			setAtPath(load, entry.path, get(entry.id));
		}
		return server;
	}
}

/**
 * Fetches the page's combined server data for a navigation, reusing a prefetch
 * when there is one.
 *
 * A prefetch warms this request for the navigation that follows, and a
 * navigation consumes it (once). So a hover costs one request, a click that
 * lands while the prefetch is still in flight awaits the same promise instead
 * of issuing a second one, and a prefetched response is never served to more
 * than the one navigation it was loaded for (no stale data on later visits).
 */
async function loadServerData(
	handler: RouteHandler,
	path: string,
	query: URLSearchParams,
	reusedLayouts: string[],
	prefetch: boolean,
): Promise<ServerData | { error: { status: number; message: string } } | undefined> {
	// The server embeds the first render's data in the HTML (see the render
	// path in site/serverHandlers.ts), so the initial hydration can read it
	// instead of making a round trip. The element is consumed once, so later
	// navigations use the fetch below
	const embedded = takeEmbeddedServerData();
	if (embedded !== undefined) {
		return attachEmbeddedDeferred(embedded);
	}

	if (!hasServerData(handler)) {
		return {};
	}

	const key = serverDataKey(path, query);

	if (prefetch) {
		const cached = client.prefetchedServerData[key];
		if (cached) return cached;

		const pending = requestServerData(path, query, reusedLayouts);
		client.prefetchedServerData[key] = pending;
		// A failed prefetch mustn't poison the navigation that follows it
		void pending.catch(() => {
			if (client.prefetchedServerData[key] === pending) {
				delete client.prefetchedServerData[key];
			}
		});
		return pending;
	}

	const prefetched = client.prefetchedServerData[key];
	if (prefetched) {
		delete client.prefetchedServerData[key];
		return prefetched;
	}

	return requestServerData(path, query, reusedLayouts);
}

/** The `/~server` request cache key: the page path and its query. */
function serverDataKey(path: string, query: URLSearchParams): string {
	return path + (query.size > 0 ? `?${query}` : "");
}

/**
 * The posted data request: `GET <page url>/~server` carrying the data header,
 * which the server answers with the page's and its layouts' server data as one
 * JSON body.
 */
async function requestServerData(
	path: string,
	query: URLSearchParams,
	reusedLayouts: string[],
): Promise<ServerData | { error: { status: number; message: string } } | undefined> {
	const url = new URL(
		document.location.origin + getBasePath() + path.replace(/\/$/, "") + "/~server",
	);
	for (let [name, value] of query) {
		url.searchParams.append(name, value);
	}

	const headers: Record<string, string> = { [DATA_REQUEST_HEADER]: "1" };
	if (reusedLayouts.length > 0) {
		headers[DATA_REUSE_HEADER] = JSON.stringify(reusedLayouts);
	}

	const response = await fetch(url, {
		redirect: "manual",
		headers,
	});
	if (isRedirect(response)) {
		return undefined;
	}
	if (!response.ok) {
		return { error: await errorOf(response) };
	}
	// A site without a server (e.g. a static host) responds with the page's
	// html rather than json; there's nothing to merge
	const type = response.headers.get("Content-Type");
	if (type?.includes("application/x-ndjson")) {
		return await readServerDataStream(response);
	}
	if (!type?.includes("application/json")) {
		return {};
	}
	return (await response.json()) as ServerData;
}

/**
 * Reads a streamed data response: the first frame carries the critical loads
 * and the list of deferred paths, later frames resolve those promises. The
 * function returns as soon as the first frame is read, so a navigation mounts
 * before slow values arrive.
 */
async function readServerDataStream(response: Response): Promise<ServerData> {
	const reader = response.body?.getReader();
	if (!reader) return {};

	const decoder = new TextDecoder();
	let buffer = "";
	const readFrame = async (): Promise<ServerDataFrame | undefined> => {
		while (true) {
			const newline = buffer.indexOf("\n");
			if (newline >= 0) {
				const line = buffer.slice(0, newline).trim();
				buffer = buffer.slice(newline + 1);
				if (line) return JSON.parse(line) as ServerDataFrame;
				continue;
			}
			const { done, value } = await reader.read();
			if (done) {
				const line = buffer.trim();
				buffer = "";
				return line ? (JSON.parse(line) as ServerDataFrame) : undefined;
			}
			buffer += decoder.decode(value, { stream: true });
		}
	};

	const first = await readFrame();
	if (!first) return {};
	if (first.loads === undefined) return {};
	const store = new DeferredStore();
	const server = store.attach(first, (id) => store.get(id));

	// Keep reading in the background. The view is already mounted; values
	// resolve their promises as the frames arrive.
	void (async () => {
		try {
			for (;;) {
				const frame = await readFrame();
				if (!frame) break;
				if (frame.type === "value" && frame.id !== undefined) {
					store.resolve(frame.id, frame.value);
				} else if (frame.type === "error" && frame.id !== undefined) {
					store.reject(frame.id, frame.message ?? "Deferred data failed");
				}
			}
			store.rejectAll(new Error("The deferred data stream ended before a value arrived"));
		} catch (error) {
			store.rejectAll(error);
		}
	})();

	return server;
}

/**
 * Recreates the promises for a page's embedded server data. The server emits
 * a bootstrap store before the inline resolve scripts, so by the time this
 * runs a value may already be resolved (or still be in flight).
 */
function attachEmbeddedDeferred(server: ServerData): ServerData {
	if (!server.deferred?.length) return server;
	const globalStore = (
		globalThis as {
			__torporDeferred?: { get(id: string): Promise<unknown> };
		}
	).__torporDeferred;
	// The bootstrap is only emitted with a deferred payload; fall back to
	// never-resolving promises rather than throwing if it is missing
	const store = new DeferredStore();
	const get = globalStore ? (id: string) => globalStore.get(id) : (id: string) => store.get(id);
	return store.attach(server, get);
}

/**
 * Reads and removes the server data the initial render embedded in the HTML
 * (a `t-server-data` script tag), or `undefined` when there is none (a later
 * navigation, or a page with no server data).
 */
function takeEmbeddedServerData(): ServerData | undefined {
	const element = document.getElementById("t-server-data");
	if (element === null) {
		return undefined;
	}
	element.remove();
	try {
		return JSON.parse(element.textContent ?? "") as ServerData;
	} catch {
		return undefined;
	}
}

/**
 * Whether the route has any server-side code to run (a page or layout server
 * load, or a folder hook). Without any, there's no data request to make.
 */
function hasServerData(handler: RouteHandler): boolean {
	if (handler.serverHooks && handler.serverHooks.length > 0) return true;
	if (handler.serverEndPoint) return true;
	return (handler.layouts ?? []).some((layout) => !!layout.serverEndPoint);
}

/**
 * The result of running a route's client load: the json it returned (if any),
 * or the non-ok Response the caller should turn into an error page. Cached as
 * a whole because a Response body can only be read once.
 */
type ClientLoadResult = {
	data?: Record<string, any>;
	response?: Response;
};

/**
 * Runs a route's client-side load, merging its json data into `data`. Returns
 * a non-ok Response for the caller to turn into an error page.
 *
 * A prefetch caches the in-flight promise, not its resolved value, so a
 * navigation that lands while the load is still running continues the same
 * request instead of running it a second time. The navigation that follows
 * consumes (and clears) the entry; a failed promise is dropped so the
 * navigation retries.
 */
async function runClientLoad(
	endPoint: PageEndPoint | undefined,
	location: string,
	query: URLSearchParams,
	params: Record<string, string>,
	data: Record<string, any>,
	prefetch: boolean,
): Promise<Response | undefined> {
	if (!endPoint?.load) return;

	const clientKey = location + (query.size > 0 ? `?${query}` : "");
	const prefetchedData = client.prefetchedData;
	let pending = prefetchedData[clientKey] as Promise<ClientLoadResult> | undefined;

	if (!pending) {
		// Only a prefetch warms the cache. A navigation runs its own load
		// directly, so a result is never left behind for a later visit.
		if (!prefetch) {
			const result = await loadClientResponse(endPoint.load, query, params, data);
			return mergeClientLoad(result, data);
		}

		const promise = loadClientResponse(endPoint.load, query, params, data);
		prefetchedData[clientKey] = promise;
		pending = promise;
		// A failed prefetch mustn't poison the navigation that follows it
		void promise.catch(() => {
			if (prefetchedData[clientKey] === promise) {
				delete prefetchedData[clientKey];
			}
		});
	} else if (!prefetch) {
		// The navigation consumes the warm entry
		delete prefetchedData[clientKey];
	}

	return mergeClientLoad(await pending, data);
}

async function loadClientResponse(
	load: NonNullable<PageEndPoint["load"]>,
	query: URLSearchParams,
	params: Record<string, string>,
	data: Record<string, any>,
): Promise<ClientLoadResult> {
	const clientUrl = new URL(document.location.href);
	for (let [name, value] of query) {
		clientUrl.searchParams.append(name, value);
	}
	const response = await load({ url: clientUrl, params, data });
	if (!response) return {};
	if (!response.ok) return { response };
	const body = await readResponseBody(response);
	return body ? { data: body } : {};
}

function mergeClientLoad(
	result: ClientLoadResult,
	data: Record<string, any>,
): Response | undefined {
	if (result.data) Object.assign(data, result.data);
	return result.response;
}

function clientLocation(path: string): string {
	return document.location.origin + getBasePath() + path;
}

function isRedirect(response: Response): boolean {
	// A `redirect: "manual"` fetch surfaces a cross-navigation redirect as an
	// opaque ("opaqueredirect") response in browsers, with status 0
	return (response.status >= 300 && response.status < 400) || response.type === "opaqueredirect";
}

/**
 * The status and message of a failed load response. The body only becomes
 * the message when it's a `message`-carrying json body or plain text -- an
 * html body is a whole page (e.g. a static host's 404), not a message.
 */
async function errorOf(response: Response): Promise<{ status: number; message: string }> {
	let message = "";
	const type = response.headers.get("Content-Type");
	if (type?.includes("application/json")) {
		try {
			const data = await response.json();
			if (typeof data.message === "string") {
				message = data.message;
			}
		} catch {
			// Not actually json
		}
	} else if (type?.includes("text/plain")) {
		message = await response.text();
	}
	return { status: response.status, message: message || response.statusText };
}
