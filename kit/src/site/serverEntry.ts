import type { ServerComponent, ServerSlotRender } from "@tera/view";
import fs from "fs";
import { IncomingMessage } from "node:http";
import path from "path";
import { deleteCookie, eventHandler, getCookie, setCookie } from "vinxi/http";
import type { CookieSerializeOptions, EventHandlerRequest, H3Event } from "vinxi/http";
import { getManifest } from "vinxi/manifest";
import notFound from "../response/notFound";
import ok from "../response/ok";
import serverError from "../response/serverError";
import $page from "../state/$page";
import type EndPoint from "../types/EndPoint";
import type RouteHandler from "../types/RouteHandler";
import type ServerEndPoint from "../types/ServerEndPoint";
import type ServerParams from "../types/ServerParams";
import routeHandlers from "./routeHandlers";

export default eventHandler(async (event) => {
	const url = new URL(`http://${process.env.HOST ?? "localhost"}${event.node.req.url}`);
	const path = url.pathname;
	const searchParams = url.searchParams;

	console.log("handling server", event.method, "for", path, "with", searchParams);

	const route = routeHandlers.match(path, searchParams);
	if (!route) {
		return notFound();
	}

	// Update $page before building the components
	// TODO: Find somewhere better to put this
	$page.url = url;

	switch (event.method) {
		case "GET": {
			// HACK: Is this the best way to signal that we want server data??
			if (path.endsWith("~server")) {
				return await loadServerData(event, url, route.handler);
			} else {
				return await loadView(event, url, route.handler);
			}
		}
		case "POST": {
			return await runAction(event, url, route.handler, searchParams);
		}
		// TODO: server endpoints
	}
});

async function loadServerData(
	event: H3Event<EventHandlerRequest>,
	url: URL,
	handler: RouteHandler,
) {
	const serverEndPoint: ServerEndPoint | undefined = (await handler.endPoint).default;
	if (serverEndPoint?.load) {
		const params = await buildServerParams(event, url);
		const result = await serverEndPoint.load(params);
		return ok(result);
	}
	return ok();
}

async function loadView(event: H3Event<EventHandlerRequest>, url: URL, handler: RouteHandler) {
	// There must be a client endpoint with a component
	const clientEndPoint: EndPoint | undefined = (await handler.endPoint).default;
	if (!clientEndPoint?.component) {
		return notFound();
	}

	// There may be a server endpoint
	const serverEndPoint: ServerEndPoint | undefined = (await handler.serverEndPoint)?.default;

	// HACK: wrangle the view into app.html
	// We could instead have an App.tera component with a slot, but you can run
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

	// Pass the data into $props
	// TODO: Promise.all
	// NOTE: We're loading data from top to bottom, overriding as we go, and I'm not sure if this is the best way to go
	let data = {};
	if (handler.layouts) {
		for (let layout of handler.layouts) {
			const layoutEndPoint: EndPoint | undefined = (await layout.endPoint)?.default;
			const layoutServerEndPoint: ServerEndPoint | undefined = (await layout.serverEndPoint)
				?.default;
			const layoutData = await loadClientAndServerData(
				event,
				url,
				data,
				layoutEndPoint,
				layoutServerEndPoint,
			);
			Object.assign(data, layoutData);
		}
	}
	let endPointData = await loadClientAndServerData(
		event,
		url,
		data,
		clientEndPoint,
		serverEndPoint,
	);
	Object.assign(data, endPointData);
	//let data = await loadClientAndServerData(event, clientEndPoint, serverEndPoint);
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
			(clientEndPoint.component as ServerComponent).render($props, context);
		let i = handler.layouts.length;
		while (i--) {
			const layoutEndPoint: EndPoint | undefined = (await handler.layouts[i].endPoint)?.default;
			if (layoutEndPoint?.component) {
				if (i === 0) {
					component = layoutEndPoint.component as ServerComponent;
					slots = { _: slotFunctions[i + 1] };
				} else {
					slotFunctions[i] = (_, context) =>
						(layoutEndPoint.component as ServerComponent).render($props, context, {
							_: slotFunctions[i + 1],
						});
				}
			}
		}
	}

	event.node.res.setHeader("content-type", "text/html");

	// Put it all together
	let html =
		appHtml.substring(0, contentStart) +
		component.render($props, undefined, slots) +
		appHtml.substring(contentEnd) +
		(hasClientScript ? `<script type="module" src="${clientScript}"></script>` : "") +
		(hasManifestJson ? `<script>window.manifest = ${manifestJson}</script>` : "");

	console.log(html);

	return html;
}

async function runAction(
	event: H3Event<EventHandlerRequest>,
	url: URL,
	handler: RouteHandler,
	searchParams: URLSearchParams,
) {
	const actionName = (Array.from(searchParams.keys())[0] || "default").replace(/^\//, "");
	const serverEndPoint: ServerEndPoint | undefined = (await handler.serverEndPoint).default;
	if (serverEndPoint?.actions) {
		const action = serverEndPoint.actions[actionName];
		if (action) {
			const params = await buildServerParams(event, url);
			return action(params);
		}
	}
}

async function loadClientAndServerData(
	event: H3Event<EventHandlerRequest>,
	url: URL,
	data: Record<string, any>,
	clientEndPoint?: EndPoint,
	serverEndPoint?: ServerEndPoint,
) {
	let newData = {};
	if (clientEndPoint?.load) {
		const params = buildClientParams(url, data);
		const clientData = await clientEndPoint.load(params);
		if (clientData) {
			Object.assign(newData, clientData);
		}
	}
	if (serverEndPoint?.load) {
		const params = await buildServerParams(event, url);
		const serverData = await serverEndPoint.load(params);
		if (serverData) {
			Object.assign(newData, serverData);
		}
	}
	return newData;
}

function buildClientParams(url: URL, data: Record<string, any>) {
	return {
		url,
		// TODO:
		params: {},
		data,
	};
}

async function buildServerParams(
	event: H3Event<EventHandlerRequest>,
	url: URL,
): Promise<ServerParams> {
	return {
		url,
		// TODO:
		params: {},
		request: await incoming_message_to_request(event.node.req, url),
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
async function incoming_message_to_request(req: IncomingMessage, url: URL): Promise<Request> {
	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (Array.isArray(value)) {
			value.forEach((v) => headers.append(key, v));
		} else if (value !== undefined) {
			headers.set(key, value);
		}
	}
	// Convert body to Buffer if applicable
	const body = req.method !== "GET" && req.method !== "HEAD" ? await get_request_body(req) : null;
	return new Request(url, {
		method: req.method,
		headers: headers,
		body: body,
	});
}

function get_request_body(req: IncomingMessage): Promise<Buffer> {
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
