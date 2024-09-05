import "vinxi/client";
import Component from "../../../view/src/compile/types/Component";
import hydrate from "../../../view/src/render/hydrate";
import mount from "../../../view/src/render/mount";
import routeHandlers from "./routeHandlers";
import EndPoint from "./types/EndPoint";

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
	const handler: EndPoint | undefined = (await route?.handler.handler).default;

	if (!handler?.view) {
		// TODO: 404
		console.log("404");
		return false;
	}

	const view = handler.view({
		routeParams: route?.routeParams,
		urlParams: route?.urlParams,
	});

	// Pass the data into $props
	const component = view.component as Component;
	let $props: Record<string, any> = {
		data: view.data,
	};

	const parent = document.getElementById("app");
	if (!parent) {
		// TODO: 500
		console.log("500");
		return false;
	}

	parent.textContent = "";

	if (firstTime) {
		hydrate(parent, component, $props);
	} else {
		mount(parent, component, $props);
	}

	return true;
}
