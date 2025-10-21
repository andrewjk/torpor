import client from "../state/client";
import type LayoutPath from "../types/LayoutPath";
import type PageEndPoint from "../types/PageEndPoint";
import type PageServerEndPoint from "../types/PageServerEndPoint";
import type RouteHandler from "../types/RouteHandler";

export default async function loadData(
	handler: RouteHandler,
	params: Record<string, string>,
	path: string,
	newLayoutStack: LayoutPath[],
	clientEndPoint: PageEndPoint | undefined,
	serverEndPoint: PageServerEndPoint | undefined,
	prefetch = false,
): Promise<Record<string, string> | void> {
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
					document.location.origin + layoutPath,
					params,
					layoutEndPoint,
					layoutServerEndPoint,
				);
				if (layoutResponse?.ok === false) {
					return;
				}
				Object.assign(data, stackLayout.data);
				newLayoutStack.push(stackLayout);
			}
		}
	}
	let endPointResponse = await loadClientAndServerData(
		data,
		document.location.origin + path,
		params,
		clientEndPoint,
		serverEndPoint,
	);
	if (endPointResponse?.ok === false) {
		return;
	}
	return data;
}

async function loadClientAndServerData(
	data: Record<string, any>,
	location: string,
	params: Record<string, string>,
	clientEndPoint?: PageEndPoint,
	serverEndPoint?: PageServerEndPoint,
): Promise<Response | undefined | void> {
	let prefetchedData = client.prefetchedData;

	if (clientEndPoint?.load) {
		if (prefetchedData[location]) {
			Object.assign(data, prefetchedData[location]);
		} else {
			const clientUrl = new URL(document.location.href);
			const clientParams = buildClientParams(clientUrl, params, data);
			const clientResponse = await clientEndPoint.load(clientParams);
			if (clientResponse) {
				if (clientResponse.ok) {
					if (clientResponse.headers.get("Content-Type")?.includes("application/json")) {
						const clientData = await clientResponse.json();
						Object.assign(data, clientData);
						prefetchedData[location] = clientData;
					}
				} else {
					return clientResponse;
				}
			}
		}
	}
	if (serverEndPoint?.load) {
		const serverUrl = location.replace(/\/$/, "") + "/~server";

		if (prefetchedData[serverUrl]) {
			Object.assign(data, prefetchedData[serverUrl]);
		} else {
			const serverResponse = await fetch(serverUrl);
			if (serverResponse) {
				if (serverResponse.ok) {
					if (serverResponse.headers.get("Content-Type")?.includes("application/json")) {
						const serverData = await serverResponse.json();
						Object.assign(data, serverData);
						prefetchedData[serverUrl] = serverData;
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
