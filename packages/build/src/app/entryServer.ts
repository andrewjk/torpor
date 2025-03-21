// @ts-ignore TODO: Create export with types?
import manifest from "@torpor/build/manifest";
import { type ServerComponent, type ServerSlotRender } from "@torpor/view";
import { ServerEvent } from "../index.ts";
//import { IncomingMessage } from "node:http";
//import { deleteCookie, eventHandler, getCookie, setCookie } from "vinxi/http";
//import { type CookieSerializeOptions, type EventHandlerRequest, H3Event } from "vinxi/http";
//import { getManifest } from "vinxi/manifest";
import notFound from "../response/notFound";
import ok from "../response/ok";
import seeOther from "../response/seeOther";
import $page from "../state/$page";
import type PageEndPoint from "../types/PageEndPoint";
import type PageServerEndPoint from "../types/PageServerEndPoint";
import RouteHandler from "../types/RouteHandler";
import type ServerEndPoint from "../types/ServerEndPoint";
import type ServerHook from "../types/ServerHook";
import type ServerLoadEvent from "../types/ServerLoadEvent.ts";
import Router from "./Router.ts";

let printedRoutes = false;

const router = new Router();
router.addPages(manifest.routes);

export async function renderLocation(ev: ServerEvent) {
	//const url = new URL(`http://${process.env.HOST ?? "localhost"}${ev.request.url}`);
	const url = new URL(ev.request.url);
	const path = url.pathname;
	const query = url.searchParams;

	console.log("handling server", ev.request.method, "for", path, query.size ? `with ${query}` : "");

	if (!printedRoutes) {
		printedRoutes = true;
		console.log("routes:\n  " + router.routes.map((r) => r.path).join("\n  "));
	}

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

	// HACK: Support any +server location??
	if (path.startsWith("/api/")) {
		return await loadData(ev, url, handler, params);
	} else if (path.endsWith("~server")) {
		// HACK: Is this the best way to signal that we want server data??
		// And can we maybe combine this with the above method, or are they too different?
		if (ev.request.method === "GET") {
			return await loadServerData(ev, url, handler, params);
		}
	} else {
		if (ev.request.method === "GET") {
			return await loadView(ev, url, handler, params);
		} else if (ev.request.method === "POST") {
			return await runAction(ev, url, handler, params, query);
		}
	}
}

async function loadData(
	ev: ServerLoadEvent,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
) {
	const functionName = ev.request.method.toLowerCase().replace("delete", "del");

	const serverEndPoint: ServerEndPoint | undefined = (await handler.endPoint()).default;
	if (serverEndPoint && serverEndPoint[functionName]) {
		const serverParams = await buildServerParams(ev, url, params);

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
}

async function loadServerData(
	ev: ServerLoadEvent,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
) {
	const serverEndPoint: PageServerEndPoint | undefined = (await handler.endPoint()).default;
	if (serverEndPoint?.load) {
		const serverParams = await buildServerParams(ev, url, params);

		if (handler.serverHook) {
			const serverHook: ServerHook | undefined = (await handler.serverHook()).default;
			if (serverHook?.handle) {
				await serverHook.handle(serverParams);
			}
		}

		const result = await serverEndPoint.load(serverParams);
		// If there was no response returned from load (such as errors or a
		// redirect), send an ok response
		return result || ok();
	}

	// It's ok if there's no load method -- we can't tell whether there will be
	// when loading routes
	//return ok();
}

async function loadView(
	ev: ServerLoadEvent,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
) {
	// There must be a client endpoint with a component
	const clientEndPoint: PageEndPoint | undefined = (await handler.endPoint()).default;
	if (!clientEndPoint?.component) {
		return notFound();
	}

	// There may be a server endpoint
	const serverEndPoint: PageServerEndPoint | undefined =
		handler.serverEndPoint && (await handler.serverEndPoint())?.default;

	// Build client scripts
	/*
	const clientManifest = getManifest("client");
	const clientHandler = clientManifest.inputs[clientManifest.handler];
	const clientScript = clientHandler.output.path;
	const hasClientScript = !!clientScript;
	const manifestJson = JSON.stringify(clientManifest.json());
	const hasManifestJson = manifestJson !== "{}";
	*/

	// Maybe hit the server hook
	const serverParams = await buildServerParams(ev, url, params);
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
			const layoutData = await loadClientAndServerData(
				url,
				params,
				serverParams,
				data,
				layoutEndPoint,
				layoutServerEndPoint,
			);
			Object.assign(data, layoutData);
		}
	}
	let endPointData = await loadClientAndServerData(
		url,
		params,
		serverParams,
		data,
		clientEndPoint,
		serverEndPoint,
	);
	Object.assign(data, endPointData);
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
		html = component($props, undefined, slots);
	} catch (error) {
		// TODO: Show a proper Error component
		html = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
		console.log(error);
	}

	return html;
}

async function runAction(
	ev: ServerLoadEvent,
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
			const serverParams = await buildServerParams(ev, url, params);

			if (handler.serverHook) {
				const serverHook: ServerHook | undefined = (await handler.serverHook()).default;
				if (serverHook?.handle) {
					await serverHook.handle(serverParams);
				}
			}

			const result = await action(serverParams);
			// If there was no response returned from the action (such as errors
			// or a redirect), reload the page by redirecting
			return result || seeOther(url.pathname);
		}
	}
}

async function loadClientAndServerData(
	url: URL,
	params: Record<string, string>,
	serverParams: ServerLoadEvent,
	data: Record<string, any>,
	clientEndPoint?: PageEndPoint,
	serverEndPoint?: PageServerEndPoint,
) {
	let newData = {};
	if (clientEndPoint?.load) {
		const clientParams = buildClientParams(url, data, params);
		const clientData = await clientEndPoint.load(clientParams);
		if (clientData) {
			Object.assign(newData, clientData);
		}
	}
	if (serverEndPoint?.load) {
		const serverData = await serverEndPoint.load(serverParams);
		if (serverData?.ok) {
			Object.assign(newData, await serverData.json());
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

// TODO: Don't need this?
async function buildServerParams(
	ev: ServerEvent,
	url: URL,
	params: Record<string, string>,
): Promise<ServerLoadEvent> {
	return {
		url,
		params,
		appData: {},
		request: ev.request,
		//request: await incomingMessageToRequest(event.node.req, url),
		//response: event.node.res,
		//cookies: {
		//	get: (name: string) => req.getCookie(event, name),
		//	set: (name: string, value: string, options?: CookieSerializeOptions) =>
		//		setCookie(event, name, value, options),
		//	delete: (name: string, options?: CookieSerializeOptions) =>
		//		deleteCookie(event, name, options),
		//},
	};
}
