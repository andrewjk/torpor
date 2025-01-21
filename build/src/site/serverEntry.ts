import type { ServerComponent, ServerSlotRender } from "@torpor/view";
import fs from "fs";
import { IncomingMessage } from "node:http";
import path from "path";
import { deleteCookie, eventHandler, getCookie, setCookie } from "vinxi/http";
import type { CookieSerializeOptions, EventHandlerRequest, H3Event } from "vinxi/http";
import { getManifest } from "vinxi/manifest";
import { ServerEndPoint } from "..";
import notFound from "../response/notFound";
import ok from "../response/ok";
import seeOther from "../response/seeOther";
import serverError from "../response/serverError";
import $page from "../state/$page";
import type PageEndPoint from "../types/PageEndPoint";
import type PageServerEndPoint from "../types/PageServerEndPoint";
import type RouteHandler from "../types/RouteHandler";
import type ServerEvent from "../types/ServerEvent";
import type ServerHook from "../types/ServerHook";
import routeHandlers from "./routeHandlers";

let printedRoutes = false;

export default eventHandler(async (event) => {
	const url = new URL(`http://${process.env.HOST ?? "localhost"}${event.node.req.url}`);
	const path = url.pathname;

	const searchParams = url.searchParams;

	console.log("handling server", event.method, "for", path, "with", searchParams);

	if (!printedRoutes) {
		printedRoutes = true;
		console.log(
			"routes:\n  " +
				routeHandlers.handlers
					.map((h) => h.path)
					.sort()
					.join("\n  "),
		);
	}

	const route = routeHandlers.match(path, searchParams);
	if (!route) {
		return notFound();
	}

	// Update $page before building the components
	// TODO: Find somewhere better to put this
	$page.url = url;

	const handler = route.handler;
	const params = route.routeParams || {};

	// TODO: Hit the server hook out here

	// HACK: Support any +server location??
	if (path.startsWith("/api/")) {
		return await loadData(event, url, handler, params);
	} else if (path.endsWith("~server")) {
		// HACK: Is this the best way to signal that we want server data??
		// And can we maybe combine this with the above method, or are they too different?
		if (event.method === "GET") {
			return await loadServerData(event, url, handler, params);
		}
	} else {
		if (event.method === "GET") {
			return await loadView(event, url, handler, params);
		} else if (event.method === "POST") {
			return await runAction(event, url, handler, params, searchParams);
		}
	}
});

async function loadData(
	event: H3Event<EventHandlerRequest>,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
) {
	const functionName = event.method.toLowerCase().replace("delete", "del");

	const serverEndPoint: ServerEndPoint | undefined = (await handler.endPoint).default;
	if (serverEndPoint && serverEndPoint[functionName]) {
		const serverParams = await buildServerParams(event, url, params);

		if (handler.serverHook) {
			const serverHook: ServerHook | undefined = (await handler.serverHook).default;
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
	event: H3Event<EventHandlerRequest>,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
) {
	const serverEndPoint: PageServerEndPoint | undefined = (await handler.endPoint).default;
	if (serverEndPoint?.load) {
		const serverParams = await buildServerParams(event, url, params);

		if (handler.serverHook) {
			const serverHook: ServerHook | undefined = (await handler.serverHook).default;
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
	event: H3Event<EventHandlerRequest>,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
) {
	// There must be a client endpoint with a component
	const clientEndPoint: PageEndPoint | undefined = (await handler.endPoint).default;
	if (!clientEndPoint?.component) {
		return notFound();
	}

	// There may be a server endpoint
	const serverEndPoint: PageServerEndPoint | undefined = (await handler.serverEndPoint)?.default;

	// HACK: wrangle the view into app.html
	// We could instead have an App.torp component with a slot, but you can run
	// into hydration problems that way e.g. if there is a browser plugin that
	// injects elements into <head> or <body>
	const appHtml = loadAppHtml();
	let contentStart = regexIndexOf(appHtml, /\<div\s+id=("app"|'app'|app)\s+/);
	contentStart = appHtml.indexOf(">", contentStart) + 1;
	let contentEnd = appHtml.indexOf("</div>", contentStart);
	if (contentStart === -1 || contentEnd === -1) {
		return serverError;
	}

	// Build client scripts
	const clientManifest = getManifest("client");
	const clientHandler = clientManifest.inputs[clientManifest.handler];
	const clientScript = clientHandler.output.path;
	const hasClientScript = !!clientScript;
	const manifestJson = JSON.stringify(clientManifest.json());
	const hasManifestJson = manifestJson !== "{}";

	// Maybe hit the server hook
	const serverParams = await buildServerParams(event, url, params);
	if (handler.serverHook) {
		const serverHook: ServerHook | undefined = (await handler.serverHook).default;
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
			const layoutEndPoint: PageEndPoint | undefined = (await layout.endPoint)?.default;
			const layoutServerEndPoint: PageServerEndPoint | undefined = (await layout.serverEndPoint)
				?.default;
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
			const layoutEndPoint: PageEndPoint | undefined = (await handler.layouts[i].endPoint)?.default;
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

	event.node.res.setHeader("content-type", "text/html");

	let componentCode = "";
	try {
		componentCode = component($props, undefined, slots);
	} catch (error) {
		// TODO: Show a proper Error component
		componentCode = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
	}

	// Put it all together
	let html =
		appHtml.substring(0, contentStart) +
		componentCode +
		appHtml.substring(contentEnd) +
		(hasClientScript ? `<script type="module" src="${clientScript}"></script>` : "") +
		(hasManifestJson ? `<script>window.manifest = ${manifestJson}</script>` : "");

	//console.log(html);

	return html;
}

async function runAction(
	event: H3Event<EventHandlerRequest>,
	url: URL,
	handler: RouteHandler,
	params: Record<string, string>,
	searchParams: URLSearchParams,
) {
	const actionName = (Array.from(searchParams.keys())[0] || "default").replace(/^\//, "");
	const serverEndPoint: PageServerEndPoint | undefined = (await handler.serverEndPoint).default;
	if (serverEndPoint?.actions) {
		const action = serverEndPoint.actions[actionName];
		if (action) {
			// TODO: form.errors etc
			const serverParams = await buildServerParams(event, url, params);

			if (handler.serverHook) {
				const serverHook: ServerHook | undefined = (await handler.serverHook).default;
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
	serverParams: ServerEvent,
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

async function buildServerParams(
	event: H3Event<EventHandlerRequest>,
	url: URL,
	params: Record<string, string>,
): Promise<ServerEvent> {
	return {
		url,
		params,
		appData: {},
		request: await incomingMessageToRequest(event.node.req, url),
		response: event.node.res,
		cookies: {
			get: (name: string) => getCookie(event, name),
			set: (name: string, value: string, options?: CookieSerializeOptions) =>
				setCookie(event, name, value, options),
			delete: (name: string, options?: CookieSerializeOptions) =>
				deleteCookie(event, name, options),
		},
	};
}

// From https://stackoverflow.com/a/78849544
async function incomingMessageToRequest(req: IncomingMessage, url: URL): Promise<Request> {
	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (Array.isArray(value)) {
			value.forEach((v) => headers.append(key, v));
		} else if (value !== undefined) {
			headers.set(key, value);
		}
	}
	// Convert body to Buffer if applicable
	const body = req.method !== "GET" && req.method !== "HEAD" ? await getRequestBody(req) : null;
	return new Request(url, {
		method: req.method,
		headers: headers,
		body: body,
	});
}

function getRequestBody(req: IncomingMessage): Promise<Buffer> {
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => {
			chunks.push(chunk);
		});
		req.on("end", () => {
			resolve(Buffer.concat(chunks));
		});
		req.on("error", (err) => {
			reject(err);
		});
	});
}

let loadedAppHtml = "";
function loadAppHtml() {
	if (!loadedAppHtml) {
		let file = path.resolve("src/app.html");
		loadedAppHtml = fs.readFileSync(file).toString();
	}
	return loadedAppHtml;
}

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
