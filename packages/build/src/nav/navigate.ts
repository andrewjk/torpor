import { clearLayoutSlot, fillLayoutSlot, hydrate } from "@torpor/view";
import { type Component, type SlotRender } from "@torpor/view";
import { mount, unmount } from "@torpor/view";
import $page from "../state/$page";
import client from "../state/client";
import { getBasePath, stripBaseFromUrl } from "../site/basePath";
import findErrorRoute from "../site/findErrorRoute";
import type LayoutPath from "../types/LayoutPath";
import type PageEndPoint from "../types/PageEndPoint";
import parseErrorStatus from "../utils/parseErrorStatus";
import formSubmit from "./formSubmit";
import loadData, { errorLayoutStack } from "./loadData";

/**
 * What a navigation did, so its caller knows whether the page is rendered or
 * the document has to take over.
 *
 * - `rendered`: the route (or its nearest error page) is in place.
 * - `server-only`: the route has no client component (e.g. a `+server` route),
 *   so only a document load can handle it.
 * - `redirect`: a load redirected, which a fetch can't follow.
 * - `failed`: nothing rendered; the caller keeps the current page and decides
 *   between a document load and telling the app (see `handleNavigationFailure`).
 * - `superseded`: a newer navigation started before this one finished and owns
 *   the result, so the caller should do nothing (in particular, it must not
 *   push a history entry or fall back to a document load).
 */
export type NavigationResult =
	| { type: "rendered" }
	| { type: "server-only" }
	| { type: "redirect" }
	| { type: "failed"; error?: unknown }
	| { type: "superseded" };

/**
 * The newest navigation's id. Each `navigate` bumps it; anything older is
 * superseded and must not commit `$page`, `client.layoutStack` or the DOM.
 */
let latestNavigation = 0;

/**
 * Aborts the newest navigation's in-flight data request when a newer one
 * starts. That's what keeps a slow (or hung) `/~server` request from delaying
 * the navigation that follows it.
 */
let activeController: AbortController | undefined;

export default function navigate(rawUrl: URL, withHydration = false): Promise<NavigationResult> {
	const id = ++latestNavigation;

	// The newest navigation wins: abort the previous one's data request and
	// let its commit checks drop it when it settles. Loading is no longer
	// serialized, so the navigation that follows doesn't wait for a slow
	// request; only the commit is (it runs synchronously after the checks).
	activeController?.abort();
	const controller = new AbortController();
	activeController = controller;

	const result = navigateNow(rawUrl, withHydration, id, controller.signal);
	const clearController = () => {
		if (activeController === controller) activeController = undefined;
	};
	// Clear the controller only if a newer navigation hasn't replaced it
	void result.then(clearController, clearController);
	return result;
}

function isSuperseded(id: number, signal: AbortSignal): boolean {
	return id !== latestNavigation || signal.aborted;
}

const SUPERSEDED: NavigationResult = { type: "superseded" };

async function navigateNow(
	rawUrl: URL,
	withHydration: boolean,
	id: number,
	signal: AbortSignal,
): Promise<NavigationResult> {
	// A failed route-module import (e.g. a stale dev dep hash), a throwing
	// load or a failed render must not reject the click handler's promise: the
	// caller's fallback would never run and the link would appear dead.
	const previousUrl = $page.url;
	const previousStatus = $page.status;
	const previousError = $page.error;
	let result: NavigationResult;
	try {
		result = await renderNavigation(rawUrl, withHydration, id, signal);
	} catch (error) {
		// An aborted request (or a failure that lands after a newer navigation
		// started) belongs to the newer navigation, not this one
		if (isSuperseded(id, signal)) return SUPERSEDED;
		console.error(error);
		result = { type: "failed", error };
	}
	if (result.type === "superseded") return result;
	if (result.type === "failed" && !withHydration && !isSuperseded(id, signal)) {
		// Nothing is on screen for this url: point the reactive state back at
		// the page that is still there, in case the caller keeps it (e.g. a
		// failed navigation while offline). The initial hydration already has
		// its server-rendered page on screen, so there is nothing to restore.
		$page.url = previousUrl;
		$page.status = previousStatus;
		$page.error = previousError;
	}
	return result;
}

async function renderNavigation(
	rawUrl: URL,
	withHydration: boolean,
	id: number,
	signal: AbortSignal,
): Promise<NavigationResult> {
	// Another navigation started before this one got to run
	if (isSuperseded(id, signal)) return SUPERSEDED;

	let parent = document.getElementById("app");
	if (!parent) {
		// TODO: 500
		console.log("500");
		return { type: "failed" };
	}

	// The base path is stripped before matching (routes are base-free), but
	// kept in browser state: the caller pushes the original URL. When the
	// url doesn't carry the base there will be no matching route anyway
	const url = stripBaseFromUrl(rawUrl, getBasePath()) ?? rawUrl;
	const path = url.pathname;
	const query = url.searchParams;

	//console.log(`navigating to '${path}'${query.size ? ` with ${query}` : ""}`);

	let route = client.router.match(path, query);

	// Update $page before building the components
	$page.url = url;
	if (route) {
		if (path.endsWith("/_error")) {
			// A direct visit to the error page (e.g. a bookmark of the url it
			// used to be redirected to). Make it look a bit classier by
			// stripping the query, which carries the status and message
			$page.status = parseErrorStatus(query.get("status"));
			$page.error = { message: query.get("message") ?? "" };
			window.history.replaceState({}, "", rawUrl.toString().split("?")[0]);
		} else {
			$page.status = 200;
			$page.error = { message: "" };
		}
	} else {
		// There's no page at this url -- render the nearest error page at it,
		// so the address bar keeps the url the user asked for: a transient
		// failure can be refreshed, and a typo can be seen and fixed
		const errorPath = findErrorRoute(client.router, path);
		const errorRoute = errorPath && client.router.match(errorPath, query);
		if (!errorRoute) {
			// Leave the current page alone; the caller falls back to a full
			// page load, and the server renders the error page (or passes the
			// raw response through, when it has no error page)
			return { type: "failed" };
		}
		route = errorRoute;
		$page.status = 404;
		$page.error = { message: "Not found" };
	}
	let handler = route.handler;
	let params = route.params || {};

	// There must be a client endpoint with a component. Routes with no client
	// component (a pure `+server` route like `/logout`) can't be rendered
	// client-side, so report `server-only` and let the caller do a full page
	// load
	let clientEndPoint: PageEndPoint | undefined = handler.endPoint
		? (await handler.endPoint())?.default
		: undefined;
	if (isSuperseded(id, signal)) return SUPERSEDED;
	if (!clientEndPoint?.component) {
		return { type: "server-only" };
	}

	let newLayoutStack: LayoutPath[] = [];

	// Pass the data into $props
	// TODO: Don't load if this is the first time -- it should have been passed
	// to us, somehow...
	const result = await loadData(
		handler,
		params,
		path,
		query,
		newLayoutStack,
		clientEndPoint,
		false,
		signal,
	);
	if (isSuperseded(id, signal)) return SUPERSEDED;
	if (result === undefined) {
		// A load redirected: the client can't follow it through fetch, so the
		// caller falls back to a full page load, which does
		return { type: "redirect" };
	}
	let data = result.data;
	if (result.error) {
		if (withHydration) {
			// The server rendered this page fine moments ago -- keep its
			// markup rather than hydrating an error page over it
			return { type: "failed" };
		}
		// The load failed -- render the nearest error page at this url, so
		// the address bar keeps the url the user asked for: a transient
		// failure (a random db hiccup, say) can be retried with a refresh
		const errorPath = findErrorRoute(client.router, path);
		const errorRoute = errorPath && client.router.match(errorPath, query);
		if (!errorRoute) {
			// No error page -- the caller falls back to a full page load,
			// where the server passes the error response through
			return { type: "failed" };
		}
		route = errorRoute;
		handler = errorRoute.handler;
		params = errorRoute.params || {};
		clientEndPoint = handler.endPoint ? (await handler.endPoint())?.default : undefined;
		if (isSuperseded(id, signal)) return SUPERSEDED;
		if (!clientEndPoint?.component) {
			return { type: "failed" };
		}

		$page.status = result.error.status;
		$page.error = { message: result.error.message };

		// The error page starts fresh: drop the layouts collected for the
		// route that failed (the error route's own layouts are loaded into
		// the empty stack, reusing whatever the current page shares)
		newLayoutStack = [];
		const errorResult = await loadData(
			handler,
			params,
			path,
			query,
			newLayoutStack,
			clientEndPoint,
			false,
			signal,
		);
		if (isSuperseded(id, signal)) return SUPERSEDED;
		if (errorResult === undefined) {
			// The error page's own load redirected: only a document load can
			// follow it
			return { type: "redirect" };
		}
		if (errorResult.error) {
			// The error page's own data can't load either (offline, or the
			// server is down). Render it over the shell with the layouts and
			// data that are already on screen rather than blanking the page
			// with a document load that would fail too.
			newLayoutStack = errorLayoutStack(handler, params);
			data = {};
		} else {
			data = errorResult.data;
		}
	}
	// From here on there are no awaits until the synchronous commit, so a
	// newer navigation can no longer interleave. Drop out if one started
	// while a module/load was in flight.
	if (isSuperseded(id, signal)) return SUPERSEDED;

	// We may have form data from a no-JS form action re-render, in a JSON
	// script (or, in a page rendered by an older server, a hidden input)
	let formElement = document.getElementById("t-form-data");
	let form: Record<string, string> | undefined;
	if (formElement) {
		form = JSON.parse(
			formElement instanceof HTMLInputElement ? formElement.value : (formElement.textContent ?? ""),
		);
		$page.form = form;
		formElement.remove();
	}
	let $props: Record<string, any> = { data };

	// We may have form data in $page.form, either from the hidden input
	// (above), or added via onformsubmit (below)
	$props.form = $page.form;

	// The root context: the page state, read in components as
	// `$context.$page`, and some special context for submitting Forms
	// client-side
	const $context = {
		$page,
		TorporBuildContext: { onformsubmit: formSubmit },
	};

	// The layout stack is assigned at commit time (inside `render`) so an
	// in-flight navigation the user supersedes can't disturb the stack the
	// newest navigation is reading
	let layoutStack = newLayoutStack;

	// If there are layouts, work our way upwards, pushing each component into
	// the default slot of its parent
	// TODO: There's probably a nicer way to do this with reducers or something
	let component = clientEndPoint.component as Component;
	let slots: Record<string, SlotRender> | undefined = undefined;
	// The index of the innermost layout that can actually be reused. It must
	// be on the same path (loadData marked it) *and* its slot region must still
	// be live: a released region has no `startNode`, and one whose window was
	// left pointing at a removed node has a detached `startNode`. A reactive
	// update inside the layout during this navigation — e.g. an @if branch
	// before the <slot> being cleared because $page.url changed — can cascade
	// through `clearRegion` and release the slot region; a post-hydration
	// re-render can remove the node it starts at. Reusing either throws on
	// `slotRegion.startNode!.parentNode`, so treat such layouts as new instead:
	// keep the nearest live ancestor layout, or fully re-render the chain below.
	let reusedIndex = -1;
	for (let i = layoutStack.length - 1; i >= 0; i--) {
		const stackLayout = layoutStack[i];
		if (stackLayout.reuse && stackLayout.slotRegion?.startNode?.parentNode != null) {
			reusedIndex = i;
			break;
		}
	}
	let reused = reusedIndex !== -1;
	if (handler.layouts) {
		let slotFunctions: SlotRender[] = [];
		// The last slot function will render the client component
		slotFunctions[handler.layouts.length] = function clientComponent(parent, anchor) {
			let i = layoutStack.length - 1;
			layoutStack[i].slotRegion = fillLayoutSlot(
				clientEndPoint.component!,
				slotFunctions[i + 1],
				parent,
				anchor,
				$props,
				$context,
			);
		};

		// Each earlier slot function will render a layout
		for (let i = handler.layouts.length - 1; i >= 0; i--) {
			const layoutEndPoint: PageEndPoint | undefined = (await handler.layouts[i].endPoint())
				?.default;
			if (layoutEndPoint?.component) {
				if (i === reusedIndex) {
					// Reuse this layout — clear and refill its slot (done in
					// the try block below so a failure doesn't leave the slot
					// half-cleared)
					component = slotFunctions[i + 1] as Component;
					break;
				} else if (i === 0) {
					component = layoutEndPoint.component as Component;
					slots = { _: slotFunctions[i + 1] };
				} else {
					slotFunctions[i] = function layoutComponent(parent, anchor, _, $context) {
						layoutStack[i - 1].slotRegion = fillLayoutSlot(
							layoutEndPoint.component!,
							slotFunctions[i + 1],
							parent,
							anchor,
							$props,
							$context,
						);
					};
				}
			}
		}
	}

	// A newer navigation may have started while a layout module was imported
	if (isSuperseded(id, signal)) return SUPERSEDED;

	// A definite alias, so that the render closure's type checks hold
	let app: HTMLElement = parent;
	// The DOM update, wrapped by the view transitions API when navigating
	// (but not on the initial hydration)
	const render = () => {
		// The view-transition callback runs after a tick, so a newer navigation
		// can have claimed the page in the meantime
		if (isSuperseded(id, signal)) return;

		// Commit the layout stack and the DOM together: no newer navigation can
		// interleave with this synchronous section, and an older one never gets
		// here (its superseded check failed above).
		client.layoutStack = layoutStack;

		try {
			if (reused) {
				// The layout is being reused — clear the old slot content, then
				// call the slot function directly to fill it with the new page.
				// We must not go through `mount` here: the slot's container still
				// holds the layout's own children (e.g. a header), which `mount`
				// refuses to mount into. Both the clear and the fill are inside
				// the try so that a failure doesn't leave the slot half-cleared.
				const slotRegion = layoutStack[reusedIndex].slotRegion;
				if (
					slotRegion === null ||
					slotRegion.startNode === null ||
					slotRegion.startNode.parentNode === null
				) {
					// The region died after we planned to reuse it (a layout
					// update ran while an endpoint was being imported). Don't
					// paint an error over the current page — reload so the
					// server renders the requested page.
					console.error(
						"The layout slot was cleared during navigation; falling back to a full page load",
					);
					window.location.reload();
					return;
				}
				app = slotRegion.startNode.parentNode as HTMLElement;
				clearLayoutSlot(slotRegion);
				// The reused layout's own context additions are gone, but the
				// root context is passed down again
				component(app, null, undefined, $context);
			} else if (withHydration) {
				hydrate(app, component, $props, slots, $context);
			} else {
				// The layout chain changed (or there was no previous layout to
				// reuse): tear down the previous UI entirely — disposing its
				// region tree and clearing `#app` — so `mount` starts fresh.
				// Without this, `mount` throws because `#app` still holds the
				// previous render's children, and it would reuse a stale root
				// region.
				unmount(app);
				mount(app, component, $props, slots, $context);
			}
		} catch (error) {
			// TODO: Show a proper Error component
			app.innerHTML = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
			console.log(error);
		}

		if (!withHydration) {
			// The navigation is committing: prefetches were for links that led
			// here, so drop them. (Do this here, not when scheduling a view
			// transition, so a superseded navigation doesn't clear the newer
			// one's prefetches.)
			client.prefetchedData = {};

			// Scroll back to the top when moving to a different page; keep the
			// scroll position for same-page navigations (query changes,
			// re-renders after form actions)
			const current = stripBaseFromUrl(new URL(document.location.href), getBasePath())?.pathname;
			if (current !== path) {
				window.scrollTo(0, 0);
			}
		}
	};

	if (
		!withHydration &&
		client.viewTransitions &&
		typeof document.startViewTransition === "function"
	) {
		document.startViewTransition(render);
	} else {
		render();
	}

	return { type: "rendered" };
}
