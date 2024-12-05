import { hydrate, mount } from "@tera/view";
import type { Component, SlotRender } from "@tera/view";
import "vinxi/client";
import $page from "../state/$page";
import type EndPoint from "../types/EndPoint";
import ServerEndPoint from "../types/ServerEndPoint";
import routeHandlers from "./routeHandlers";

// Intercept clicks on links
window.addEventListener("click", async (e) => {
	if (e.target && (e.target as HTMLElement).tagName === "A") {
		e.preventDefault();
		const href = (e.target as HTMLLinkElement).href;
		const url = new URL(href);

		// Update $page before building the components
		// TODO: Find somewhere better to put this
		$page.url = url;

		if (await navigate(url.pathname, url.searchParams)) {
			window.history.pushState(null, "", url);
		} else {
			window.location.href = href;
		}
	}
});

// Listen for changes to the URL that occur when the user navigates using the
// back or forward buttons
window.addEventListener("popstate", async () => {
	await navigateToLocation(document.location);
});

// Do the initial navigation and hydration
navigateToLocation(document.location, true);

async function navigateToLocation(location: Location, firstTime = false) {
	return await navigate(location.pathname, new URLSearchParams(location.search), firstTime);
}

async function navigate(
	path: string,
	urlParams: URLSearchParams,
	firstTime = false,
): Promise<boolean> {
	console.log("navigating client to", path, "with", urlParams.toString());

	const parent = document.getElementById("app");
	if (!parent) {
		// TODO: 500
		console.log("500");
		return false;
	}

	const route = routeHandlers.match(path, urlParams);
	if (!route) {
		// TODO: 404
		console.log("404");
		return false;
	}

	// Update $page before building the components
	// TODO: Find somewhere better to put this
	//$page.url = new URL(document.location.href);

	const handler = route.handler;
	const params = route.routeParams || {};

	// There must be a client endpoint with a component
	const clientEndPoint: EndPoint | undefined = (await handler.endPoint).default;
	if (!clientEndPoint?.component) {
		// TODO: 404
		console.log("404");
		return false;
	}

	// There may be a server endpoint
	const serverEndPoint: ServerEndPoint | undefined = (await handler.serverEndPoint)?.default;

	// Pass the data into $props
	// TODO: Don't load if this is the first time -- it should have been passed to us, somehow...
	let data = {};
	if (handler.layouts) {
		for (let layout of handler.layouts) {
			let layoutPath = layout.path;
			for (let key in params) {
				layoutPath = layoutPath.replace(`[${key}]`, params[key]);
			}
			const layoutEndPoint: EndPoint | undefined = (await layout.endPoint)?.default;
			const layoutServerEndPoint: ServerEndPoint | undefined = (await layout.serverEndPoint)
				?.default;
			const layoutData = await loadClientAndServerData(
				data,
				document.location.origin + layoutPath,
				params,
				layoutEndPoint,
				layoutServerEndPoint,
			);
			Object.assign(data, layoutData);
		}
	}
	let endPointData = await loadClientAndServerData(
		data,
		document.location.origin + path,
		params,
		clientEndPoint,
		serverEndPoint,
	);
	Object.assign(data, endPointData);
	let $props: Record<string, any> = { data };

	// If there are layouts, work our way upwards, pushing each component into
	// the default slot of its parent
	// TODO: Also handle layout server data
	// TODO: There's probably a nicer way to do this with reducers or something
	let component = clientEndPoint.component as Component;
	let slots: Record<string, SlotRender> | undefined = undefined;
	if (handler.layouts) {
		let slotFunctions: SlotRender[] = [];
		slotFunctions[handler.layouts.length] = (parent, anchor, _, context) =>
			clientEndPoint.component!(parent, anchor, $props, context);
		for (let i = handler.layouts.length - 1; i >= 0; i--) {
			const layoutEndPoint: EndPoint | undefined = (await handler.layouts[i].endPoint)?.default;
			if (layoutEndPoint?.component) {
				if (i === 0) {
					component = layoutEndPoint.component as Component;
					slots = { _: slotFunctions[i + 1] };
				} else {
					slotFunctions[i] = (parent, anchor, _, context) =>
						layoutEndPoint.component!(parent, anchor, $props, context, {
							_: slotFunctions[i + 1],
						});
				}
			}
		}
	}

	if (firstTime) {
		hydrate(parent, component, $props, slots);
	} else {
		// TODO: Clear ranges, reuse layouts etc
		parent.textContent = "";

		try {
			mount(parent, component, $props, slots);
		} catch {
			// TODO: Show a proper Error component
			parent.innerHTML = '<span style="color: red">Script syntax error</span>';
		}
	}

	return true;
}

async function loadClientAndServerData(
	data: Record<string, any>,
	location: string,
	params: Record<string, string>,
	clientEndPoint?: EndPoint,
	serverEndPoint?: ServerEndPoint,
) {
	let newData = {};
	if (clientEndPoint?.load) {
		const clientUrl = new URL(document.location.href);
		const clientParams = buildClientParams(clientUrl, params, data);
		const clientData = await clientEndPoint.load(clientParams);
		if (clientData) {
			Object.assign(newData, clientData);
		}
	}
	if (serverEndPoint?.load) {
		const serverUrl = location.replace(/\/$/, "") + "/~server";
		const serverResponse = await fetch(serverUrl);
		if (
			serverResponse?.ok &&
			serverResponse.headers.get("content-type")?.includes("application/json")
		) {
			const serverData = await serverResponse.json();
			Object.assign(newData, serverData);
		}
	}
	return newData;
}

function buildClientParams(url: URL, params: Record<string, string>, data: Record<string, any>) {
	return {
		url,
		params,
		data,
	};
}
