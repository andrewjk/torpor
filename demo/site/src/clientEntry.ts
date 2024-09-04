import "vinxi/client";
import hydrate from "../../../view/src/render/hydrate";
import mount from "../../../view/src/render/mount";
import routeHandlers from "./routeHandlers";
import Route from "./types/RouteHandler";

// Intercept clicks on links
window.addEventListener("click", async (e) => {
	if (e.target && (e.target as HTMLElement).tagName === "A") {
		e.preventDefault();
		const href = (e.target as HTMLLinkElement).href;
		const path = new URL(href);
		if (await navigate(path.pathname, path.searchParams)) {
			window.history.pushState(null, "", path);
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
await navigateToLocation(document.location, true);

async function navigateToLocation(location: Location, firstTime = false) {
	return await navigate(location.pathname, new URLSearchParams(location.search), firstTime);
}

async function navigate(
	path: string,
	urlParams: URLSearchParams,
	firstTime = false,
): Promise<boolean> {
	console.log("navigating client to", path, urlParams.toString());

	const route = routeHandlers.match(path, urlParams);
	const handler: Route | undefined = await route?.handler.handler;

	if (!handler?.view) {
		// TODO: 404
		console.log("404");
		return false;
	}

	const view = handler.view({
		routeParams: route?.routeParams,
		urlParams: route?.urlParams,
	});

	// Maybe from params??
	let $props: Record<string, any> = {};

	const parent = document.getElementById("app");
	if (!parent) {
		// TODO: 500
		console.log("500");
		return false;
	}

	parent.textContent = "";

	if (firstTime) {
		hydrate(parent, view as any, $props);
	} else {
		mount(parent, view as any, $props);
	}

	return true;
}
