import { type ServerComponent, type ServerSlotRender } from "@torpor/view/ssr";
import path from "node:path";
import formDataToRecord from "../form/formDataToRecord.ts";
import notFound from "../response/notFound.ts";
import ok from "../response/ok.ts";
import seeOther from "../response/seeOther.ts";
import ServerEvent from "../server/ServerEvent.ts";
import Router from "../site/Router.ts";
import Site from "../site/Site";
import $page from "../state/$page.ts";
import type PageEndPoint from "../types/PageEndPoint.ts";
import type PageServerEndPoint from "../types/PageServerEndPoint.ts";
import type RouteHandler from "../types/RouteHandler.ts";
import type ServerRequest from "../types/ServerRequest.ts";
import {
	ERROR_ROUTE,
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
import searchParamsToRecord from "../utils/searchParamsToRecord.ts";
import validate from "../validation/validate.ts";
import ValidationError from "../validation/ValidationError.ts";
import {
	endpointSchema,
	validateEndpointParams,
	validateHandlerInput,
	validationErrorResponse,
} from "../validation/endpoint.ts";

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
			endPoint: async () => {
				if (r.file) {
					const mod = await import(/* @vite-ignore */ path.join(site.root, r.file));
					// A .torp file's default export is a component, so wrap it as
					// a PageEndPoint ({ component }) for the entries
					if (r.file.endsWith(".torp")) {
						return { default: { component: mod.default } };
					}
					return mod;
				}
				// Inline endpoint (no file) — return directly from memory
				return { default: r.endPoint };
			},
			subFolder: r.subFolder,
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
	if (path.endsWith("/_error")) {
		$page.status = parseInt(query.get("status") ?? "404");
		$page.error = { message: query.get("message") ?? "" };
	} else {
		$page.status = 200;
	}

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
				const serverEndPoint: PageServerEndPoint | undefined =
					handler.serverEndPoint && (await handler.serverEndPoint()).default;
				return await runAction(ev, url, handler, serverEndPoint, params, query);
			}
			break;
		}
		case PAGE_SERVER_ROUTE:
		case LAYOUT_SERVER_ROUTE: {
			// It's a /+page.server.ts or /_layout.server.ts endpoint
			if (ev.request.method === "GET") {
				return await loadData(ev, url, handler, "load", params);
			} else if (ev.request.method === "POST") {
				const serverEndPoint: PageServerEndPoint | undefined =
					handler.endPoint && (await handler.endPoint()).default;
				return await runAction(ev, url, handler, serverEndPoint, params, query);
			}
			break;
		}
		case SERVER_ROUTE: {
			// It's a /+server.ts endpoint
			const functionName = ev.request.method.toLowerCase().replace("delete", "del");
			return await loadData(ev, url, handler, functionName, params);
		}
		case ERROR_ROUTE: {
			return await loadView(ev, url, handler, params, template);
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
	params: Record<string, any>,
) {
	const serverEndPoint: ServerEndPoint | undefined = (await handler.endPoint()).default;
	// `functionName` is computed from the request method, so the handlers are
	// accessed through a loose record
	const handlers = serverEndPoint as unknown as Record<string, ServerRequest | undefined>;
	const handlerFn: ServerRequest | undefined = handlers?.[functionName];
	if (serverEndPoint && handlerFn) {
		// Route params come from the URL, so a failed validation means the
		// resource doesn't exist
		try {
			params = await validateEndpointParams(serverEndPoint, params);
		} catch (error) {
			if (error instanceof ValidationError) return notFound();
			throw error;
		}

		try {
			// If the endpoint declares a schema for this handler, validate its
			// input up front and reject with 422 if it fails. get/head schemas
			// validate the query string; other schemas validate the json body
			const schema = endpointSchema(serverEndPoint, functionName);
			const values = await validateHandlerInput(schema, functionName, url, ev);

			const serverParams = buildServerParams(ev, url, params, values);

			const serverHook: ServerHook | undefined = handler.serverHook
				? (await handler.serverHook()).default
				: undefined;
			// The hook can return a Response to short-circuit the request
			const enterResult = await serverHook?.enter?.(serverParams);

			try {
				const result = enterResult || (await handlerFn(serverParams));

				// If there was no response returned from load (such as errors or a
				// redirect), send an ok response
				return result || ok();
			} finally {
				await serverHook?.exit?.(serverParams);
			}
		} catch (error) {
			const response = validationErrorResponse(error);
			if (response) return response;
			throw error;
		}
	}

	return notFound();
}

async function loadView(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	params: Record<string, any>,
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

	// Validate the route params and the load query against the server
	// endpoint's schemas, if it declares any. Params come from the URL, so a
	// failed validation means the resource doesn't exist; a failed query
	// returns like any other load failure
	let query: unknown;
	if (serverEndPoint) {
		try {
			params = await validateEndpointParams(serverEndPoint, params);
		} catch (error) {
			if (error instanceof ValidationError) return notFound();
			throw error;
		}
		const loadSchema = endpointSchema(serverEndPoint, "load");
		if (loadSchema) {
			try {
				query = await validate(loadSchema, searchParamsToRecord(url.searchParams));
			} catch (error) {
				const response = validationErrorResponse(error);
				if (response) return response;
				throw error;
			}
		}
	}

	// Maybe hit the server hook
	const serverParams = buildServerParams(ev, url, params, query ? { query } : {});
	const serverHook: ServerHook | undefined = handler.serverHook
		? (await handler.serverHook()).default
		: undefined;
	// The hook can return a Response to short-circuit the request
	const enterResult = await serverHook?.enter?.(serverParams);

	try {
		if (enterResult) {
			return enterResult;
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

		let styles = "";

		// If there are layouts, work our way upwards, pushing each component into
		// the default slot of its parent
		// TODO: Also handle layout server data
		// TODO: There's probably a nicer way to do this with reducers or something
		let component = clientEndPoint.component as ServerComponent;
		let slots: Record<string, ServerSlotRender> | undefined = undefined;
		if (handler.layouts) {
			let slotFunctions: ServerSlotRender[] = [];
			slotFunctions[handler.layouts.length] = (_, $context) => {
				let { body, head } = (clientEndPoint.component as ServerComponent)($props, $context);
				styles += head;
				return body;
			};
			for (let i = handler.layouts.length - 1; i >= 0; i--) {
				const layoutEndPoint: PageEndPoint | undefined = (await handler.layouts[i].endPoint())
					?.default;
				if (layoutEndPoint?.component) {
					if (i === 0) {
						component = layoutEndPoint.component as ServerComponent;
						slots = { _: slotFunctions[i + 1] };
					} else {
						slotFunctions[i] = (_, $context) => {
							let { body, head } = (layoutEndPoint.component as ServerComponent)($props, $context, {
								_: slotFunctions[i + 1],
							});
							styles += head;
							return body;
						};
					}
				}
			}
		}

		let html;
		try {
			let { body, head } = component($props, undefined, slots);
			styles += head;
			html = template.replace("%COMPONENT_BODY%", body).replace("%COMPONENT_HEAD%", styles);
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
	} finally {
		await serverHook?.exit?.(serverParams);
	}
}

async function runAction(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	serverEndPoint: PageServerEndPoint | undefined,
	params: Record<string, any>,
	query: URLSearchParams,
) {
	const actionName = (Array.from(query.keys())[0] || "default").replace(/^\//, "");
	if (serverEndPoint?.actions) {
		const action = serverEndPoint.actions[actionName];
		if (action) {
			// TODO: form.errors etc
			// Route params come from the URL, so a failed validation means the
			// resource doesn't exist
			try {
				params = await validateEndpointParams(serverEndPoint, params);
			} catch (error) {
				if (error instanceof ValidationError) return notFound();
				throw error;
			}

			let result: Response | undefined | void;
			try {
				// If the endpoint declares a schema for this action, validate the
				// submitted form data up front and reject with 422 if it fails
				const schema = endpointSchema(serverEndPoint, actionName);
				const form = schema
					? await validate(schema, await formDataToRecord(ev.request))
					: undefined;

				const serverParams = buildServerParams(ev, url, params, form ? { form } : {});

				const serverHook: ServerHook | undefined = handler.serverHook
					? (await handler.serverHook()).default
					: undefined;
				// The hook can return a Response to short-circuit the action
				const enterResult = await serverHook?.enter?.(serverParams);

				try {
					result = enterResult || (await action(serverParams));
				} finally {
					await serverHook?.exit?.(serverParams);
				}
			} catch (error) {
				const response = validationErrorResponse(error);
				if (response) return response;
				throw error;
			}

			// If there was no response returned from the action (such as errors
			// or a redirect), reload the page by redirecting
			return result || seeOther(url.pathname);
		}
	}

	return notFound();
}

async function loadClientAndServerData(
	url: URL,
	params: Record<string, any>,
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

function buildClientParams(url: URL, params: Record<string, any>, data: Record<string, any>) {
	return {
		url,
		params,
		data,
	};
}

function buildServerParams(
	ev: ServerEvent,
	url: URL,
	params: Record<string, any>,
	values: { json?: unknown; form?: unknown; query?: unknown } = {},
): ServerLoadEvent {
	return {
		url,
		params,
		appData: {},
		request: ev.request,
		// The inputs may have been validated already, in which case the request
		// body has been consumed and the parsed values are returned instead.
		// Their types come from the endpoint's schemas, so they are loosely
		// typed here
		json: (): Promise<any> =>
			values.json !== undefined ? Promise.resolve(values.json) : ev.json(),
		form: (): Promise<any> =>
			values.form !== undefined ? Promise.resolve(values.form) : formDataToRecord(ev.request),
		query: (): Promise<any> =>
			values.query !== undefined
				? Promise.resolve(values.query)
				: Promise.resolve(searchParamsToRecord(url.searchParams)),
		cookies: ev.cookies,
		headers: ev.headers,
		adapter: ev.adapter,
	};
}
