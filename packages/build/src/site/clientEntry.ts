import manifest from "@torpor/build/manifest";
// @ts-ignore This errors in the Cloudflare build?
import { $page } from "@torpor/build/state";
import { clearLayoutSlot, hydrate, runLayoutSlot } from "@torpor/view";
import { type Component, type SlotRender } from "@torpor/view";
import { mount } from "@torpor/view";
import type PageEndPoint from "../types/PageEndPoint.ts";
import type PageServerEndPoint from "../types/PageServerEndPoint.ts";
import Router from "./Router.ts";

// Build the router from the Site object created by the user
const router = new Router();
router.addPages(manifest.routes);

// Store the current layout stack, so that we can re-use parts of it as necessary
interface LayoutPath {
	path: string;
	/** Whether to re-use this layout */
	reuse: boolean;
	/** Data loaded from endpoints that should be re-used */
	data: any;
	/** The range of the UI in this layout's slot */
	slotRange: any;
}
let layoutStack: LayoutPath[] = [];

// Intercept clicks on links
window.addEventListener("click", async (e) => {
	if (e.target && (e.target as HTMLElement).tagName === "A") {
		e.preventDefault();
		const href = (e.target as HTMLLinkElement).href;
		const url = new URL(href);

		if (await navigate(url)) {
			window.history.pushState(null, "", url);
		} else {
			window.location.href = href;
		}
	}
});

// TODO: Intercept more events on links so that we can preload

// Listen for changes to the URL that occur when the user navigates using the
// back or forward buttons
window.addEventListener("popstate", async () => {
	await navigateToLocation(document.location);
});

// Do the initial navigation and hydration
navigateToLocation(document.location, true);

async function navigateToLocation(location: Location, firstTime = false) {
	return await navigate(new URL(location.toString()), firstTime);
}

async function navigate(url: URL, firstTime = false): Promise<boolean> {
	let parent = document.getElementById("app");
	if (!parent) {
		// TODO: 500
		console.log("500");
		return false;
	}

	const path = url.pathname;
	const query = url.searchParams;

	console.log(`navigating to '${path}'${query.size ? ` with ${query}` : ""}`);

	const route = router.match(path, query);
	if (!route) {
		// TODO: 404
		console.log("404");
		return false;
	}

	// Update $page before building the components
	$page.url = url;
	if (path.endsWith("/_error")) {
		$page.status = parseInt(query.get("status") ?? "404");
		$page.error.message = query.get("message") ?? "";
		// Make it look a bit classier by removing the query
		window.history.replaceState({}, "", url.toString().split("?")[0]);
	} else {
		$page.status = 200;
	}

	const handler = route.handler;
	const params = route.params || {};

	// There must be a client endpoint with a component
	const clientEndPoint: PageEndPoint | undefined = (await handler.endPoint()).default;
	if (!clientEndPoint?.component) {
		// TODO: 404
		console.log("404");
		return false;
	}

	// There may be a server endpoint
	const serverEndPoint: PageServerEndPoint | undefined =
		handler.serverEndPoint && (await handler.serverEndPoint())?.default;

	let newStack: LayoutPath[] = [];

	// Pass the data into $props
	// TODO: Don't load if this is the first time -- it should have been passed to us, somehow...
	let data = {};
	if (handler.layouts) {
		for (let [i, layout] of handler.layouts.entries()) {
			let layoutPath = layout.path;
			if (layoutStack.at(i)?.path === layoutPath) {
				// We've already loaded this layout, we can just re-use its data
				layoutStack[i].reuse = true;
				newStack[i] = layoutStack[i];
				Object.assign(data, layoutStack[i].data);
			} else {
				const stackLayout = { path: layoutPath, data: {}, reuse: false, slotRange: null };
				for (let key in params) {
					layoutPath = layoutPath.replace(`[${key}]`, params[key]);
				}
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
					return false;
				}
				Object.assign(data, stackLayout.data);
				newStack.push(stackLayout);
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
		return false;
	}
	let $props: Record<string, any> = { data };

	layoutStack.push({ path: route.handler.path, data: {}, reuse: false, slotRange: null });
	layoutStack = newStack;

	// If there are layouts, work our way upwards, pushing each component into
	// the default slot of its parent
	// TODO: There's probably a nicer way to do this with reducers or something
	let component = clientEndPoint.component as Component;
	let slots: Record<string, SlotRender> | undefined = undefined;
	if (handler.layouts) {
		let slotFunctions: SlotRender[] = [];
		// The last slot function will render the client component
		slotFunctions[handler.layouts.length] = function clientComponent(parent, anchor, _, $context) {
			if (clientEndPoint.component) {
				let i = layoutStack.length - 1;
				layoutStack[i].slotRange = runLayoutSlot(
					clientEndPoint.component,
					slotFunctions[i + 1],
					parent,
					anchor,
					$props,
					$context,
				);
			}
		};

		// Each earlier slot function will render a layout
		for (let i = handler.layouts.length - 1; i >= 0; i--) {
			const layoutEndPoint: PageEndPoint | undefined = (await handler.layouts[i].endPoint())
				?.default;
			if (layoutEndPoint?.component) {
				if (layoutStack[i].reuse) {
					// Set the parent to add the new content to (from the old
					// content), clear the range under this point, and set the
					// component to the slot function within this layout
					parent = layoutStack[i].slotRange.startNode.parentNode as HTMLElement;
					clearLayoutSlot(layoutStack[i].slotRange);
					component = slotFunctions[i + 1];
					break;
				} else if (i === 0) {
					component = layoutEndPoint.component as Component;
					slots = { _: slotFunctions[i + 1] };
				} else {
					slotFunctions[i] = function layoutComponent(parent, anchor, _, $context) {
						if (layoutEndPoint.component) {
							layoutStack[i].slotRange = runLayoutSlot(
								layoutEndPoint.component,
								slotFunctions[i + 1],
								parent,
								anchor,
								$props,
								$context,
							);
						}
					};
				}
			}
		}
	}

	if (firstTime) {
		hydrate(parent, component, $props, slots);
	} else {
		try {
			mount(parent, component, $props, slots);
		} catch (error) {
			// TODO: Show a proper Error component
			parent.innerHTML = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
			console.log(error);
		}
	}

	return true;
}

async function loadClientAndServerData(
	data: Record<string, any>,
	location: string,
	params: Record<string, string>,
	clientEndPoint?: PageEndPoint,
	serverEndPoint?: PageServerEndPoint,
): Promise<Response | void> {
	if (clientEndPoint?.load) {
		const clientUrl = new URL(document.location.href);
		const clientParams = buildClientParams(clientUrl, params, data);
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
		const serverUrl = location.replace(/\/$/, "") + "/~server";
		const serverResponse = await fetch(serverUrl);
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
