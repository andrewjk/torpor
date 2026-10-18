import { DATA_REUSE_HEADER, DATA_REQUEST_HEADER } from "../dataRequest.ts";
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

	// Work out up front which layouts are already rendered (their data and UI
	// are reused), so the data request can skip loading them
	const layoutStack = client.layoutStack;
	const layouts = (handler.layouts ?? []).map((layout, index) => {
		let layoutPath = layout.path;
		for (let key in params) {
			layoutPath = layoutPath.replace(`[${key}]`, params[key]);
		}
		const previous = layoutStack.at(index);
		const reuse = !prefetch && previous?.path === layoutPath;
		return { layout, index, layoutPath, previous, reuse };
	});

	// One request for all the (non-reused) server data
	const server = await loadServerData(
		handler,
		path,
		query,
		layouts.filter((l) => l.reuse).map((l) => l.layoutPath),
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

	for (const { layout, index, layoutPath, previous, reuse } of layouts) {
		const stackLayout: LayoutPath = {
			path: layoutPath,
			data: {},
			reuse,
			slotRegion: null,
		};

		if (reuse && previous) {
			// The layout is already rendered: keep its data and slot region
			stackLayout.slotRegion = previous.slotRegion;
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
	const response = await runClientLoad(clientEndPoint, clientLocation(path), query, params, data);
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
};

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
		return embedded;
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
	if (!response.headers.get("Content-Type")?.includes("application/json")) {
		return {};
	}
	return (await response.json()) as ServerData;
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
 * Runs a route's client-side load, merging its json data into `data`. Returns
 * a non-ok Response for the caller to turn into an error page.
 */
async function runClientLoad(
	endPoint: PageEndPoint | undefined,
	location: string,
	query: URLSearchParams,
	params: Record<string, string>,
	data: Record<string, any>,
): Promise<Response | undefined> {
	if (!endPoint?.load) return;

	const clientKey = location + (query.size > 0 ? `?${query}` : "");
	const prefetchedData = client.prefetchedData;
	if (prefetchedData[clientKey]) {
		Object.assign(data, prefetchedData[clientKey]);
		return;
	}

	const clientUrl = new URL(document.location.href);
	for (let [name, value] of query) {
		clientUrl.searchParams.append(name, value);
	}
	const clientResponse = await endPoint.load({ url: clientUrl, params, data });
	if (clientResponse) {
		if (clientResponse.ok) {
			if (clientResponse.headers.get("Content-Type")?.includes("application/json")) {
				const clientData = await clientResponse.json();
				Object.assign(data, clientData);
				prefetchedData[clientKey] = clientData;
			}
		} else {
			return clientResponse;
		}
	}
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
