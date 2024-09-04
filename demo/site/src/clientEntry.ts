import "vinxi/client";
import hydrate from "../../../view/src/render/hydrate";
import mount from "../../../view/src/render/mount";
import routeHandlers from "./routeHandlers";
import Route from "./types/RouteHandler";

// Intercept clicks on links
window.addEventListener("click", async (e) => {
	if (e.target && (e.target as HTMLElement).tagName === "A") {
		e.preventDefault();
		const path = new URL((e.target as HTMLLinkElement).href).pathname;
		if (await navigate(path)) {
			window.history.pushState(null, "", path);
		} else {
			window.location.href = path;
		}
	}
});

// Listen for changes to the URL that occur when the user navigates using the
// back or forward buttons
window.addEventListener("popstate", async () => {
	await navigate(document.location.pathname);
});

// Do the initial navigation and hydration
await navigate(document.location.pathname, true);

async function navigate(path: string, firstTime = false): Promise<boolean> {
	console.log("navigating client to", path);
	console.log(JSON.stringify(routeHandlers, null, 2));
	const route = routeHandlers.find((route) => route.path === path);
	const handler: Route | undefined = await route?.handler;

	if (!handler?.view) {
		// TODO: 404
		console.log("404");
		return false;
	}

	const view = handler.view();

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
