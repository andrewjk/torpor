import client from "../state/client";
import { getBasePath } from "../site/basePath";
import type LayoutPath from "../types/LayoutPath";
import type PageEndPoint from "../types/PageEndPoint";
import type PageServerEndPoint from "../types/PageServerEndPoint";
import type RouteHandler from "../types/RouteHandler";

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

export default async function loadData(
	handler: RouteHandler,
	params: Record<string, string>,
	path: string,
	query: URLSearchParams,
	newLayoutStack: LayoutPath[],
	clientEndPoint: PageEndPoint | undefined,
	serverEndPoint: PageServerEndPoint | undefined,
	prefetch = false,
): Promise<LoadDataResult | void> {
	let data = {};
	if (handler.layouts) {
		let layoutStack = client.layoutStack;
		for (let [i, layout] of handler.layouts.entries()) {
			let layoutPath = layout.path;
			for (let key in params) {
				layoutPath = layoutPath.replace(`[${key}]`, params[key]);
			}
			if (layoutStack.at(i)?.path === layoutPath) {
				// We've already loaded this layout, we can just re-use its data and UI
				if (!prefetch) {
					layoutStack[i].reuse = true;
				}
				newLayoutStack[i] = layoutStack[i];
				Object.assign(data, layoutStack[i].data);
			} else {
				const stackLayout = { path: layoutPath, data: {}, reuse: false, slotRegion: null };
				const layoutEndPoint: PageEndPoint | undefined = (await layout.endPoint())?.default;
				const layoutServerEndPoint: PageServerEndPoint | undefined =
					layout.serverEndPoint && (await layout.serverEndPoint())?.default;
				const layoutResponse = await loadClientAndServerData(
					stackLayout.data,
					document.location.origin + getBasePath() + layoutPath,
					query,
					params,
					layoutEndPoint,
					layoutServerEndPoint,
				);
				if (layoutResponse?.ok === false) {
					if (isRedirect(layoutResponse)) {
						// A redirect isn't ours to follow client-side; the
						// caller's full page load will
						return;
					}
					return { data, error: await errorOf(layoutResponse) };
				}
				Object.assign(data, stackLayout.data);
				newLayoutStack.push(stackLayout);
			}
		}
	}
	let endPointResponse = await loadClientAndServerData(
		data,
		document.location.origin + getBasePath() + path,
		query,
		params,
		clientEndPoint,
		serverEndPoint,
	);
	if (endPointResponse?.ok === false) {
		if (isRedirect(endPointResponse)) {
			return;
		}
		return { data, error: await errorOf(endPointResponse) };
	}
	return { data };
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

async function loadClientAndServerData(
	data: Record<string, any>,
	location: string,
	query: URLSearchParams,
	params: Record<string, string>,
	clientEndPoint?: PageEndPoint,
	serverEndPoint?: PageServerEndPoint,
): Promise<Response | undefined | void> {
	let prefetchedData = client.prefetchedData;

	if (clientEndPoint?.load) {
		const clientKey = location + (query.size > 0 ? `?${query}` : "");
		if (prefetchedData[clientKey]) {
			Object.assign(data, prefetchedData[clientKey]);
		} else {
			const clientUrl = new URL(document.location.href);
			for (let [name, value] of query) {
				clientUrl.searchParams.append(name, value);
			}
			const clientParams = buildClientParams(clientUrl, params, data);
			const clientResponse = await clientEndPoint.load(clientParams);
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
	}

	if (serverEndPoint?.load) {
		const serverLocation = location.replace(/\/$/, "") + "/~server";
		const serverKey = serverLocation + (query.size > 0 ? `?${query}` : "");
		if (prefetchedData[serverKey]) {
			Object.assign(data, prefetchedData[serverKey]);
		} else {
			const serverUrl = new URL(serverLocation);
			for (let [name, value] of query) {
				serverUrl.searchParams.append(name, value);
			}
			// Don't follow redirects: a server load can redirect (e.g. an auth
			// hook), which isn't ours to follow client-side -- returning here
			// lets the caller fall back to a full page load, which follows it
			const serverResponse = await fetch(serverUrl, { redirect: "manual" });
			if (serverResponse) {
				if (serverResponse.ok) {
					if (serverResponse.headers.get("Content-Type")?.includes("application/json")) {
						const serverData = await serverResponse.json();
						Object.assign(data, serverData);
						prefetchedData[serverKey] = serverData;
					}
				} else {
					return serverResponse;
				}
			}
		}
	}
}

function buildClientParams(url: URL, params: Record<string, string>, data: Record<string, any>) {
	return {
		url,
		params,
		data,
	};
}
