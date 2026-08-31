import manifest from "@torpor/build/manifest";
import loadData from "../nav/loadData.ts";
import navigate from "../nav/navigate.ts";
import $page from "../state/$page.ts";
import client from "../state/client";
import type LayoutPath from "../types/LayoutPath";
import type PageEndPoint from "../types/PageEndPoint";
import type PageServerEndPoint from "../types/PageServerEndPoint";
import Router from "./Router.ts";

// Build the router from the Site object created by the user
const router = new Router();
router.addPages(manifest.routes);

// Put it in client state so that it can be accessed from navigate. We can't
// just import it to navigate because that gets built by tsdown, without Vite
// and the manifest
client.router = router;

// Intercept clicks on links
window.addEventListener("click", async (e) => {
	const link = getLink(e.target);
	if (link) {
		if (ignoreAnchorMouseEvent(link, e)) {
			return;
		}

		e.preventDefault();

		const href = link.href;
		const url = new URL(href);

		if (await navigate(url)) {
			window.history.pushState(null, "", url);
		} else {
			window.location.href = href;
		}
	}
});

// Intercept mouseover/focus/touchstart on links for prefetching
// TODO: settings e.g. <a href="" data-tb-prefetch="eager"/"visible"/"hover"/"touch">
window.addEventListener("mouseover", maybePrefetch);
window.addEventListener("touchstart", maybePrefetch);

async function maybePrefetch(e: MouseEvent | TouchEvent) {
	const link = getLink(e.target);
	if (link) {
		if (ignoreAnchorMouseEvent(link, e)) {
			return;
		}

		const href = link.href;
		const url = new URL(href);

		const path = url.pathname;
		const query = url.searchParams;
		const route = router.match(path, query);
		if (route) {
			const handler = route.handler;
			const params = route.params || {};

			// There should be a client endpoint
			const clientEndPoint: PageEndPoint | undefined = (await handler.endPoint()).default;

			// There may be a server endpoint
			const serverEndPoint: PageServerEndPoint | undefined =
				handler.serverEndPoint && (await handler.serverEndPoint())?.default;

			// Just dummy this up
			let newStack: LayoutPath[] = [];

			await loadData(handler, params, path, query, newStack, clientEndPoint, serverEndPoint, true);
		}
	}
}

function getLink(target: EventTarget | null): HTMLAnchorElement | undefined {
	// The target may be a child element of the link (e.g. an icon inside it),
	// so walk up to the nearest actual link. Fragment-only links (href="#...")
	// are left to the browser's native jump-to-anchor behavior
	if (!(target instanceof Element)) return;
	const link = target.closest("a[href]");
	if (link?.getAttribute("href")?.startsWith("#")) return;
	return (link as HTMLAnchorElement) ?? undefined;
}

function ignoreAnchorMouseEvent(link: HTMLAnchorElement, e: MouseEvent | TouchEvent) {
	// Ignore the event if it was already handled (e.g. a user handler calling
	// preventDefault), a modifier key is pressed, the target is not "_self"
	// (e.g. "_blank"), rel="external", it's a download link, or it's in a
	// contenteditable region
	return (
		e.defaultPrevented ||
		e.altKey ||
		e.ctrlKey ||
		e.metaKey ||
		e.shiftKey ||
		(link.target && link.target !== "_self") ||
		link.rel === "external" ||
		link.hasAttribute("download") ||
		link.isContentEditable
	);
}

// Listen for changes to the URL that occur when the user navigates using the
// back or forward buttons
window.addEventListener("popstate", async () => {
	await navigateToLocation(document.location);
});

// Do the initial navigation and hydration
await navigateToLocation(document.location, true);

async function navigateToLocation(location: Location, firstTime = false) {
	// Reset $page on submit and link navigation
	// TODO: Should we put data in $page.data??
	$page.form = undefined;

	return await navigate(new URL(location.toString()), firstTime);
}
