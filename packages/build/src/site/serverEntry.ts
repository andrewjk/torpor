import manifest from "@torpor/build/manifest";
import { type ServerComponent, type ServerSlotRender } from "@torpor/view/ssr";
import formDataToRecord from "../form/formDataToRecord.ts";
import notFound from "../response/notFound.ts";
import ok from "../response/ok.ts";
import seeOther from "../response/seeOther.ts";
import ServerEvent from "../server/ServerEvent.ts";
import $page from "../state/$serverPage.ts";
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
	validationErrorResponse,
} from "../validation/endpoint.ts";
import { findMissingSlotLayout, warnMissingSlotContent } from "./layoutSlots.ts";
import Router from "./Router.ts";

// Build the router from the Site object created by the user
const router = new Router();
router.addPages(manifest.routes);

//console.log(`routes:\n  ${router.routes.map((r) => r.path).join("\n  ")}`);

export async function load(ev: ServerEvent, template?: string): Promise<Response> {
	const url = ev.url;
	const path = url.pathname;
	const query = url.searchParams;

	//console.log(`handling ${ev.request.method} for '${path}'${query.size ? ` with ${query}` : ""}`);

	let route = router.match(path, query);
	if (!route) {
		// If the route wasn't found, the user may be posting a form to a
		// +page.server.ts route that doesn't have a corresponding +page.ts
		// route, which is allowed, so check for that as well
		if (ev.request.method === "POST" && !path.endsWith("/~server")) {
			const serverPath =
				(path.endsWith("/") ? path.substring(0, path.length - 1) : path) + "/~server";
			route = router.match(serverPath, query);
		}
	}
	if (!route) {
		return handleResponse(notFound());
	}
	const handler = route.handler;
	const params = route.params || {};

	// Update $page before building the components
	$page.url = url;
	if (path.endsWith("/_error")) {
		$page.status = parseInt(query.get("status") ?? "404");
		$page.error = { message: query.get("message") ?? "" };
	} else {
		$page.status = 200;
	}

	// TODO: Hit the server hook out here
	// We could maybe set data loading up as middleware on a route??????

	switch (handler.type) {
		case PAGE_ROUTE:
		case LAYOUT_ROUTE: {
			// It's a /+page.ts or /_layout.ts endpoint
			if (ev.request.method === "GET") {
				return handleResponse(await loadView(ev, url, handler, params, template));
			} else if (ev.request.method === "POST") {
				// The server end point comes from the sibling /+page.server.ts, if applicable
				const serverEndPoint: PageServerEndPoint | undefined =
					handler.serverEndPoint && (await handler.serverEndPoint()).default;
				return handleResponse(
					await runAction(ev, url, handler, serverEndPoint, params, query, template),
					true,
				);
			}
			break;
		}
		case PAGE_SERVER_ROUTE:
		case LAYOUT_SERVER_ROUTE: {
			// It's a /+page.server.ts or /_layout.server.ts endpoint
			if (ev.request.method === "GET") {
				return await loadData(ev, url, handler, "load", params);
			} else if (ev.request.method === "POST") {
				const serverEndPoint: PageServerEndPoint | undefined = (await resolveModule(handler))
					.default;
				return handleResponse(
					await runAction(ev, url, handler, serverEndPoint, params, query, template),
					true,
				);
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
		case ERROR_ROUTE: {
			return await loadView(ev, url, handler, params, template);
		}
	}

	return notFound();
}

/**
 * Resolves the route's endpoint module, caching it on the handler so warm
 * requests don't pay for the loader promise.
 */
async function resolveModule(handler: RouteHandler): Promise<any> {
	return (handler.resolvedModule ??= await (handler.modulePromise ??= handler.endPoint()));
}

async function loadServerHooks(handler: RouteHandler): Promise<ServerHook[]> {
	if (!handler.serverHooks) return [];
	// Resolve each hook module once and cache the result on the handler
	return (handler.resolvedHooks ??= Promise.all(
		handler.serverHooks.map(async (load) => (await load()).default),
	));
}

async function handleResponse(response: Response, fromForm = false): Promise<Response> {
	$page.status = response.status;

	// Success codes and redirect codes are acceptable
	if (response.status >= 200 && response.status <= 399) {
		return response;
	}

	// 4xx error codes are acceptable from form actions
	if (fromForm && response.status >= 400 && response.status <= 499) {
		return response;
	}

	// It's an error, so redirect to the error page
	// We're just pushing the status and message in the URL, but maybe there's a
	// more sophisticated way to do this?
	// TODO: Should be returning loadView rather than redirecting
	// TODO: Should be returning the NEAREST error page to this path, including layouts
	let params = new URLSearchParams();
	params.append("status", $page.status.toString());
	let message = await response.text();
	if (response.headers.get("Content-Type")?.includes("application/json")) {
		const data = JSON.parse(message);
		message = data.message ?? message;
	}
	if (message) {
		if ($page.error) {
			$page.error.message = message;
		} else {
			$page.error = { message };
		}
		params.append("message", message);
	}
	return seeOther(`/_error?${params.toString()}`);
}

async function loadData(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	functionName: string,
	params: Record<string, any>,
) {
	// The endpoint module is cached on the handler, so once warm this is a
	// plain property read
	const mod = handler.resolvedModule ?? (await resolveModule(handler));
	const serverEndPoint: ServerEndPoint | undefined = mod?.default;
	// `functionName` is computed from the request method, so the handlers are
	// accessed through a loose record
	const handlerFn = (
		serverEndPoint as unknown as Record<string, ServerRequest | undefined> | undefined
	)?.[functionName];
	if (!serverEndPoint || !handlerFn) {
		return notFound();
	}

	// Route params come from the URL, so a failed validation means the
	// resource doesn't exist. Only endpoints declaring a params schema pay
	// for validation
	const paramsSchema = endpointSchema(serverEndPoint, "params");
	if (paramsSchema) {
		try {
			params = (await validate(paramsSchema, params)) as Record<string, any>;
		} catch (error) {
			if (error instanceof ValidationError) return notFound();
			throw error;
		}
	}

	try {
		// If the endpoint declares a schema for this handler, validate its
		// input up front and reject with 422 if it fails. get/head/load
		// schemas validate the query string; other schemas validate the json
		// body. Endpoints without a schema skip straight to the handler
		const schema = endpointSchema(serverEndPoint, functionName);
		const values = schema
			? functionName === "get" || functionName === "head" || functionName === "load"
				? { query: await validate(schema, searchParamsToRecord(url.searchParams)) }
				: { json: await validate(schema, await ev.json()) }
			: {};

		const serverParams = buildServerParams(ev, url, params, values);

		// Hooks are resolved once per handler; routes without hooks don't
		// await anything here
		const hooks = handler.serverHooks ? await loadServerHooks(handler) : [];

		let entered = 0;
		let enterResponse: Response | undefined = undefined;
		try {
			// Hooks run from the root down; a hook's enter can return a
			// Response to short-circuit the request
			for (; entered < hooks.length && !enterResponse; entered++) {
				const hookResult = await hooks[entered].enter?.(serverParams);
				if (hookResult) {
					enterResponse = hookResult;
				}
			}

			// If there was no response returned from load (such as errors or a
			// redirect), send an ok response
			return (await handlerFn(serverParams)) || ok();
		} finally {
			// Run exit hooks in reverse order for hooks that were entered
			while (entered > 0) {
				entered--;
				await hooks[entered].exit?.(serverParams);
			}
		}
	} catch (error) {
		const response = validationErrorResponse(error);
		if (response) return response;
		throw error;
	}
}

async function loadView(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	params: Record<string, any>,
	template: string | undefined,
	formStatus?: number,
	form?: Record<string, string | number>,
	skipHook?: boolean,
) {
	// There must be a client endpoint with a component
	const clientEndPoint: PageEndPoint | undefined = (await resolveModule(handler)).default;
	if (!clientEndPoint?.component) {
		return notFound();
	}

	// The template comes from site.html, which endpoints-only sites don't have
	if (!template) {
		throw new Error(
			"Page routes require a src/site.html file, which was not found; add it, or remove page/layout routes to serve endpoints only",
		);
	}

	// There may be a server endpoint
	const serverEndPoint: PageServerEndPoint | undefined =
		handler.serverEndPoint && (await handler.serverEndPoint())?.default;

	// Validate the route params and the load query against the server
	// endpoint's schemas, if it declares any. Params come from the URL, so a
	// failed validation means the resource doesn't exist; a failed query goes
	// to the error page like any other load failure
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

	// Maybe hit the server hooks -- unless they already ran for this request,
	// which is the case when the view is re-rendered after a form action
	const serverParams = buildServerParams(ev, url, params, query ? { query } : {});
	const serverHooks = skipHook ? [] : await loadServerHooks(handler);
	let entered = 0;
	let enterResponse: Response | undefined = undefined;
	try {
		// Hooks run from the root down; a hook's enter can return a Response
		// to short-circuit the request
		for (; entered < serverHooks.length && !enterResponse; entered++) {
			const hookResult = await serverHooks[entered].enter?.(serverParams);
			if (hookResult) {
				enterResponse = hookResult;
			}
		}
		if (enterResponse) {
			return enterResponse;
		}

		// Pass the data into $props
		// TODO: Promise.all
		// NOTE: We're loading data from top to bottom, overriding as we go, and I'm
		// not sure if this is the best way to go
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
		let $props: Record<string, any> = { data, form };

		let styles = "";

		// If there are layouts, work our way upwards, pushing each component into
		// the default slot of its parent
		// TODO: Also handle layout server data
		// TODO: There's probably a nicer way to do this with reducers or something
		let component = clientEndPoint.component as ServerComponent;
		let slots: Record<string, ServerSlotRender> | undefined = undefined;
		// Which slot levels actually ran during the render below, so a layout
		// that never rendered its <slot /> (silently dropping the page
		// content) can be reported (see findMissingSlotLayout)
		const invokedLevels = new Set<number>();
		const trackSlot = (level: number, slot: ServerSlotRender): ServerSlotRender => {
			return ($slot, $context) => {
				invokedLevels.add(level);
				return slot($slot, $context);
			};
		};
		if (handler.layouts) {
			let slotFunctions: ServerSlotRender[] = [];
			// The last slot function will render the client component
			slotFunctions[handler.layouts.length] = trackSlot(handler.layouts.length, (_, $context) => {
				let { body, head } = (clientEndPoint.component as ServerComponent)($props, $context);
				styles += head;
				return body;
			});
			for (let i = handler.layouts.length - 1; i >= 0; i--) {
				const layoutEndPoint: PageEndPoint | undefined = (await handler.layouts[i].endPoint())
					?.default;
				if (layoutEndPoint?.component) {
					if (i === 0) {
						component = layoutEndPoint.component as ServerComponent;
						slots = { _: slotFunctions[i + 1] };
					} else {
						slotFunctions[i] = trackSlot(i, (_, $context) => {
							let { body, head } = (layoutEndPoint.component as ServerComponent)($props, $context, {
								_: slotFunctions[i + 1],
							});
							styles += head;
							return body;
						});
					}
				}
			}
		}

		let html;
		try {
			let { body, head } = component($props, undefined, slots);

			// Put the form info in a hidden input so that it can be accessed on the client
			if (form) {
				body += `\n<input type="hidden" id="t-form-data" value='${JSON.stringify(form).replaceAll("'", "\\'")}' />`;
			}

			styles += head;
			html = template.replace("%COMPONENT_BODY%", body).replace("%COMPONENT_HEAD%", styles);
		} catch (error) {
			// TODO: Show a proper Error component
			html = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
			console.log(error);
		}

		// A layout that never rendered <slot /> silently drops the whole page
		// content from the output; find and report the outermost one
		if (handler.layouts) {
			const missingLayout = findMissingSlotLayout(handler.layouts, invokedLevels);
			if (missingLayout !== undefined) {
				warnMissingSlotContent(missingLayout);
			}
		}

		return new Response(html, {
			status: formStatus ?? 200,
			headers: {
				"Content-Type": "text/html",
			},
		});
	} finally {
		// Run exit hooks in reverse order for hooks that were entered
		while (entered > 0) {
			entered--;
			await serverHooks[entered].exit?.(serverParams);
		}
	}
}

async function runAction(
	ev: ServerEvent,
	url: URL,
	handler: RouteHandler,
	serverEndPoint: PageServerEndPoint | undefined,
	params: Record<string, any>,
	query: URLSearchParams,
	template: string | undefined,
) {
	const actionName = (Array.from(query.keys())[0] || "default").replace(/^\//, "");
	if (serverEndPoint?.actions) {
		const action = serverEndPoint.actions[actionName];
		if (action) {
			if (actionName === "load" || actionName === "params") {
				// These names are reserved in the endpoint's schema map: `load`
				// validates the query string and `params` the route params, so
				// an action with one of these names would get the wrong schema
				// applied to its form data
				throw new Error(
					`The action name "${actionName}" is reserved. ` +
						`Rename the action (and its schema key, if any), e.g. to "save".`,
				);
			}
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

				const serverHooks = await loadServerHooks(handler);
				let entered = 0;
				let enterResponse: Response | undefined = undefined;
				try {
					// Hooks run from the root down; a hook's enter can return a
					// Response to short-circuit the action
					for (; entered < serverHooks.length && !enterResponse; entered++) {
						const hookResult = await serverHooks[entered].enter?.(serverParams);
						if (hookResult) {
							enterResponse = hookResult;
						}
					}

					result = enterResponse || (await action(serverParams));
				} finally {
					// Run exit hooks in reverse order for hooks that were entered
					while (entered > 0) {
						entered--;
						await serverHooks[entered].exit?.(serverParams);
					}
				}
			} catch (error) {
				const response = validationErrorResponse(error);
				if (response) return response;
				throw error;
			}

			if (ev.request.headers.has("X-Torpor-Form-Submit")) {
				// If the form was submitted from javascript, just return the
				// response and it will be handled on the client
				// TODO: Should we make the user return a response??
				result ??= ok();

				// If it's a redirect, we need to stop the browser handling it
				if (result.status >= 300 && result.status <= 399) {
					const location = result.headers.get("Location") ?? "";
					result = ok();
					result.headers.set("X-Torpor-Form-Redirect", "");
					result.headers.set("Location", location);
				}

				return result;
			} else if (
				!result ||
				(result.status >= 200 && result.status <= 299) ||
				(result.status >= 400 && result.status <= 499)
			) {
				// If the form was submitted without javascript, and there was
				// no result, an ok result, or a 4xx error, re-render the view
				// with the form result. The server hook already ran around the
				// action, so it is not run again here
				// Keep the query string, so that loads validating the query see
				// the same values as the original GET
				const newUrl = new URL(url.pathname + url.search, url);
				const formStatus = result?.status;
				let formMessage = await result?.text();
				if (formMessage && result?.headers.get("Content-Type")?.includes("application/json")) {
					$page.form = JSON.parse(formMessage);
					formMessage = undefined;
				} else {
					$page.form = {};
				}
				// Set status and message if they haven't already been set,
				// which means that you can just return e.g. forbidden() or
				// forbidden("no!") and there will be something you can work
				// with in your component, or you can set a completely custom
				// object with whatever info you need
				$page.form!.status ??= formStatus ?? 0;
				$page.form!.message ??= formMessage ?? "";
				return await loadView(ev, newUrl, handler, params, template, formStatus, $page.form, true);
			} else {
				// If the form was submitted without javascript and there was a
				// redirect or server error, just return the result to handle it
				// as normal
				return result;
			}
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
		const clientParams = buildClientParams(url, params, data);
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
