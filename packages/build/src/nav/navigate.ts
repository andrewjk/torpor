import { clearLayoutSlot, fillLayoutSlot, hydrate } from "@torpor/view";
import { type Component, type SlotRender } from "@torpor/view";
import { mount, unmount } from "@torpor/view";
import $page from "../state/$page";
import client from "../state/client";
import { getBasePath, stripBaseFromUrl } from "../site/basePath";
import findErrorRoute from "../site/findErrorRoute";
import type LayoutPath from "../types/LayoutPath";
import type PageEndPoint from "../types/PageEndPoint";
import formSubmit from "./formSubmit";
import loadData from "./loadData";

// @ts-ignore
export default async function navigate(rawUrl: URL, withHydration = false): Promise<boolean> {
	let parent = document.getElementById("app");
	if (!parent) {
		// TODO: 500
		console.log("500");
		return false;
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
			$page.status = parseInt(query.get("status") ?? "404");
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
			return false;
		}
		route = errorRoute;
		$page.status = 404;
		$page.error = { message: "Not found" };
	}
	let handler = route.handler;
	let params = route.params || {};

	// There must be a client endpoint with a component. Routes with no client
	// component (a pure `+server` route like `/logout`) can't be rendered
	// client-side, so return false and let the caller do a full page load
	let clientEndPoint: PageEndPoint | undefined = handler.endPoint
		? (await handler.endPoint())?.default
		: undefined;
	if (!clientEndPoint?.component) {
		return false;
	}

	let newLayoutStack: LayoutPath[] = [];

	// Pass the data into $props
	// TODO: Don't load if this is the first time -- it should have been passed
	// to us, somehow...
	const result = await loadData(handler, params, path, query, newLayoutStack, clientEndPoint);
	if (result === undefined) {
		// A load redirected, or (on a prerendered site with no server) the
		// ~server request couldn't be made. Leave the current page alone;
		// the caller (e.g. the client entry) falls back to a full page load,
		// which follows the redirect
		return false;
	}
	let data = result.data;
	if (result.error) {
		if (withHydration) {
			// The server rendered this page fine moments ago -- keep its
			// markup rather than hydrating an error page over it
			return false;
		}
		// The load failed -- render the nearest error page at this url, so
		// the address bar keeps the url the user asked for: a transient
		// failure (a random db hiccup, say) can be retried with a refresh
		const errorPath = findErrorRoute(client.router, path);
		const errorRoute = errorPath && client.router.match(errorPath, query);
		if (!errorRoute) {
			// No error page -- the caller falls back to a full page load,
			// where the server passes the error response through
			return false;
		}
		route = errorRoute;
		handler = errorRoute.handler;
		params = errorRoute.params || {};
		clientEndPoint = handler.endPoint ? (await handler.endPoint())?.default : undefined;
		if (!clientEndPoint?.component) {
			return false;
		}

		$page.status = result.error.status;
		$page.error = { message: result.error.message };

		// The error page starts fresh: drop the layouts collected for the
		// route that failed (the error route's own layouts are loaded into
		// the empty stack, reusing whatever the current page shares)
		newLayoutStack.length = 0;
		const errorResult = await loadData(
			handler,
			params,
			path,
			query,
			newLayoutStack,
			clientEndPoint,
		);
		if (errorResult === undefined || errorResult.error) {
			// The error page's own load failed too -- fall back to a full
			// page load
			return false;
		}
		data = errorResult.data;
	}
	// We may have form data in a hidden input -- not sure if this is the best
	// way to do it
	let formInput = document.getElementById("t-form-data") as HTMLInputElement;
	let form: Record<string, string> | undefined;
	if (formInput) {
		form = JSON.parse(formInput.value);
		$page.form = form;
		formInput.remove();
	}
	let $props: Record<string, any> = { data };

	// We may have form data in $page.form, either from the hidden input
	// (above), or added via onformsubmit (below)
	$props.form = $page.form;

	// Add some special context for submitting Forms client-side
	const $context = {
		TorporBuildContext: { onformsubmit: formSubmit },
	};

	client.layoutStack.push({ path: route.handler.path, data: {}, reuse: false, slotRegion: null });
	client.layoutStack = newLayoutStack;
	let layoutStack = client.layoutStack;

	// If there are layouts, work our way upwards, pushing each component into
	// the default slot of its parent
	// TODO: There's probably a nicer way to do this with reducers or something
	let component = clientEndPoint.component as Component;
	let slots: Record<string, SlotRender> | undefined = undefined;
	let reused = false;
	// The index of the innermost reused layout. Its slotRegion is the region
	// that must be cleared and refilled (it contains the next layout's or the
	// page's content). This is usually the last entry of the stack, but not
	// when an outer layout is reused while an inner one is new — e.g.
	// navigating between sections that share the root layout.
	let reusedIndex = -1;
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
				if (layoutStack[i].reuse) {
					// Reuse this layout — clear and refill its slot (done in
					// the try block below so a failure doesn't leave the slot
					// half-cleared)
					component = slotFunctions[i + 1] as Component;
					reusedIndex = i;
					reused = true;
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

	// A definite alias, so that the render closure's type checks hold
	let app: HTMLElement = parent;
	// The DOM update, wrapped by the view transitions API when navigating
	// (but not on the initial hydration)
	const render = () => {
		try {
			if (reused) {
				// The layout is being reused — clear the old slot content, then
				// call the slot function directly to fill it with the new page.
				// We must not go through `mount` here: the slot's container still
				// holds the layout's own children (e.g. a header), which `mount`
				// refuses to mount into. Both the clear and the fill are inside
				// the try so that a failure doesn't leave the slot half-cleared.
				const slotRegion = layoutStack[reusedIndex].slotRegion;
				app = slotRegion.startNode!.parentNode as HTMLElement;
				clearLayoutSlot(slotRegion);
				component(app, null);
			} else if (withHydration) {
				hydrate(app, component, $props, slots);
			} else {
				// The layout chain changed (or there was no previous layout to
				// reuse): tear down the previous UI entirely — disposing its
				// region tree and clearing `#app` — so `mount` starts fresh.
				// Without this, `mount` throws because `#app` still holds the
				// previous render's children, and it would reuse a stale root
				// region.
				unmount(app);
				mount(app, component, $props, slots);
			}
		} catch (error) {
			// TODO: Show a proper Error component
			app.innerHTML = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
			console.log(error);
		}

		if (!withHydration) {
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

	// Reset prefetched data on each navigation
	client.prefetchedData = {};

	return true;
}
