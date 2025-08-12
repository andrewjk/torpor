import { type ServerComponent, type ServerSlotRender } from "@torpor/view";
import path from "node:path";
import notFound from "../response/notFound.ts";
import ok from "../response/ok.ts";
import seeOther from "../response/seeOther.ts";
import ServerEvent from "../server/ServerEvent.ts";
import Router from "../site/Router.ts";
import Site from "../site/Site";
import $page from "../state/$page.ts";
import type PageEndPoint from "../types/PageEndPoint.ts";
import type PageServerEndPoint from "../types/PageServerEndPoint.ts";
import RouteHandler from "../types/RouteHandler.ts";
import {
	HOOK_ROUTE,
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_ROUTE,
	PAGE_SERVER_ROUTE,
	SERVER_ROUTE,
} from "../types/RouteType";
import type ServerEndPoint from "../types/ServerEndPoint.ts";
import type ServerHook from "../types/ServerHook.ts";
import type ServerLoadEvent from "../types/ServerLoadEvent.ts";

/**
 * Runs a site route in test mode
 * @param site The site configuration, with routing configured
 * @param route The route path e.g. `/home`
 * @param ev An optional ServerEvent, which you can use to set test cookies and headers
 * @returns An HTTP response containing the requested data, HTML, or error status
 */
export default async function runTest(
	site: Site,
	route: string,
	ev?: ServerEvent,
): Promise<Response> {
	if (!route.startsWith("/")) route += "/";
	if (!ev) {
		const req = new Request(`http://localhost${route}`);
		ev = new ServerEvent(req);
	}

	// Build the router from the Site object created by the user
	const router = new Router();
	router.addPages(
		site.routes.map((r) => ({
			path: r.path,
			type: r.type,
			endPoint: () => import(/* @vite-ignore */ path.join(site.root, r.file)),
		})),
	);

	return await load(router, ev, "%COMPONENT_BODY%");
}

// HACK: This is a copy of serverEntry
// TODO: Make it shared instead!
async function load(router: Router, ev: ServerEvent, template: string): Promise<Response> {
	//const url = new URL(`http://${process.env.HOST ?? "localhost"}${ev.request.url}`);
	const url = new URL(ev.request.url);
	const path = url.pathname;
	const query = url.searchParams;

	//console.log(`handling ${ev.request.method} for '${path}'${query.size ? ` with ${query}` : ""}`);

	const route = router.match(path, query);
	if (!route) {
		return notFound();
	}

	// Update $page before building the components
	// TODO: Find somewhere better to put this
	$page.url = url;

	const handler = route.handler;
	const params = route.params || {};

	// TODO: Hit the server hook out here
	// We could maybe set data loading up as middleware on a route??????

	switch (handler.type) {
		case PAGE_ROUTE:
		case LAYOUT_ROUTE: {
			// It's a /+page.ts or /_layout.ts endpoint
			if (ev.request.method === "GET") {
				return await loadView(ev, url, handler, params, template);
			} else if (ev.request.method === "POST") {
				return await runAction(ev, url, handler, params, query);
			}
			break;
		}
		case PAGE_SERVER_ROUTE:
		case LAYOUT_SERVER_ROUTE: {
			// It's a /+page.server.ts or /_layout.server.ts endpoint
			if (ev.request.method === "GET") {
				return await loadData(ev, url, handler, "load", params);
			}
			break;
		}
		case SERVER_ROUTE: {
			// It's a /+server.ts endpoint
			const functionName = ev.request.method.toLowerCase().replace("delete", "del");
			return await loadData(ev, url, handler, functionName, params);
		}
		case HOOK_ROUTE:
		case HOOK_SERVER_ROUTE: {
			break;
		}
	}

	return notFound();
}

async function loadData(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	functionName: string,
	params: Record<string, string>,
) {
	const serverEndPoint: ServerEndPoint | undefined = (await handler.endPoint()).default;
	if (serverEndPoint && serverEndPoint[functionName]) {
		const serverParams = buildServerParams(ev, url, params);

		if (handler.serverHook) {
			const serverHook: ServerHook | undefined = (await handler.serverHook()).default;
			if (serverHook?.handle) {
				await serverHook.handle(serverParams);
			}
		}

		const result = await serverEndPoint[functionName](serverParams);

		// If there was no response returned from load (such as errors or a
		// redirect), send an ok response
		return result || ok();
	}

	return notFound();
}

async function loadView(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
	template: string,
) {
	// There must be a client endpoint with a component
	const clientEndPoint: PageEndPoint | undefined = (await handler.endPoint()).default;
	if (!clientEndPoint?.component) {
		return notFound();
	}

	// There may be a server endpoint
	const serverEndPoint: PageServerEndPoint | undefined =
		handler.serverEndPoint && (await handler.serverEndPoint())?.default;

	// Maybe hit the server hook
	const serverParams = buildServerParams(ev, url, params);
	if (handler.serverHook) {
		const serverHook: ServerHook | undefined = (await handler.serverHook()).default;
		if (serverHook?.handle) {
			await serverHook.handle(serverParams);
		}
	}

	// Pass the data into $props
	// TODO: Promise.all
	// NOTE: We're loading data from top to bottom, overriding as we go, and I'm not sure if this is the best way to go
	let data = {};
	if (handler.layouts) {
		for (let layout of handler.layouts) {
			const layoutEndPoint: PageEndPoint | undefined = (await layout.endPoint())?.default;
			const layoutServerEndPoint: PageServerEndPoint | undefined =
				layout.serverEndPoint && (await layout.serverEndPoint())?.default;
			const layoutResponse = await loadClientAndServerData(
				url,
				params,
				serverParams,
				data,
				layoutEndPoint,
				layoutServerEndPoint,
			);
			if (layoutResponse?.ok === false) {
				return layoutResponse;
			}
		}
	}
	let endPointResponse = await loadClientAndServerData(
		url,
		params,
		serverParams,
		data,
		clientEndPoint,
		serverEndPoint,
	);
	if (endPointResponse?.ok === false) {
		return endPointResponse;
	}
	let $props: Record<string, any> = { data };

	// If there are layouts, work our way upwards, pushing each component into
	// the default slot of its parent
	// TODO: Also handle layout server data
	// TODO: There's probably a nicer way to do this with reducers or something
	// TODO: Re-use parent layouts
	let component = clientEndPoint.component as ServerComponent;
	let slots: Record<string, ServerSlotRender> | undefined = undefined;
	if (handler.layouts) {
		let slotFunctions: ServerSlotRender[] = [];
		slotFunctions[handler.layouts.length] = (_, context) =>
			(clientEndPoint.component as ServerComponent)($props, context);
		for (let i = handler.layouts.length - 1; i >= 0; i--) {
			const layoutEndPoint: PageEndPoint | undefined = (await handler.layouts[i].endPoint())
				?.default;
			if (layoutEndPoint?.component) {
				if (i === 0) {
					component = layoutEndPoint.component as ServerComponent;
					slots = { _: slotFunctions[i + 1] };
				} else {
					slotFunctions[i] = (_, context) =>
						(layoutEndPoint.component as ServerComponent)($props, context, {
							_: slotFunctions[i + 1],
						});
				}
			}
		}
	}

	let html;
	try {
		let { body, head } = component($props, undefined, slots);
		html = template.replace("%COMPONENT_BODY%", body).replace("%COMPONENT_HEAD", head);
	} catch (error) {
		// TODO: Show a proper Error component
		html = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
		console.log(error);
	}

	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html",
		},
	});
}

async function runAction(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
	query: URLSearchParams,
) {
	const actionName = (Array.from(query.keys())[0] || "default").replace(/^\//, "");
	const serverEndPoint: PageServerEndPoint | undefined =
		handler.serverEndPoint && (await handler.serverEndPoint()).default;
	if (serverEndPoint?.actions) {
		const action = serverEndPoint.actions[actionName];
		if (action) {
			// TODO: form.errors etc
			const serverParams = buildServerParams(ev, url, params);

			if (handler.serverHook) {
				const serverHook: ServerHook | undefined = (await handler.serverHook()).default;
				if (serverHook?.handle) {
					await serverHook.handle(serverParams);
				}
			}

			const result = await action(serverParams); // <--

			// If there was no response returned from the action (such as errors
			// or a redirect), reload the page by redirecting
			return result || seeOther(url.pathname);
		}
	}

	return notFound();
}

async function loadClientAndServerData(
	url: URL,
	params: Record<string, string>,
	serverParams: ServerLoadEvent,
	data: Record<string, any>,
	clientEndPoint?: PageEndPoint,
	serverEndPoint?: PageServerEndPoint,
) {
	if (clientEndPoint?.load) {
		const clientParams = buildClientParams(url, data, params);
		const clientResponse = await clientEndPoint.load(clientParams);
		if (clientResponse) {
			if (clientResponse.ok) {
				if (clientResponse.headers.get("Content-Type")?.includes("application/json")) {
					Object.assign(data, await clientResponse.json());
				}
			} else {
				return clientResponse;
			}
		}
	}
	if (serverEndPoint?.load) {
		const serverResponse = await serverEndPoint.load(serverParams);
		if (serverResponse) {
			if (serverResponse.ok) {
				if (serverResponse.headers.get("Content-Type")?.includes("application/json")) {
					Object.assign(data, await serverResponse.json());
				}
			} else {
				return serverResponse;
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

function buildServerParams(
	ev: ServerEvent,
	url: URL,
	params: Record<string, string>,
): ServerLoadEvent {
	return {
		url,
		params,
		appData: {},
		request: ev.request,
		cookies: ev.cookies,
		headers: ev.headers,
		adapter: ev.adapter,
	};
}
