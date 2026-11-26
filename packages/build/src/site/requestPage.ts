import type ServerEvent from "../server/ServerEvent";
import type PageState from "../types/PageState";

// Each request's page state, keyed by its event so that concurrent requests
// (which interleave at every `await`) can't see each other's url, status,
// flash message or form result. Weak, so a state goes when its request does
const pages = new WeakMap<ServerEvent, PageState>();

/**
 * Gets the page state of the request `ev`, creating it on first use. Page
 * renders pass it to their components as `$context.$page`.
 */
export default function pageOf(ev: ServerEvent): PageState {
	let page = pages.get(ev);
	if (!page) {
		page = {
			status: 404,
			url: ev.url,
			form: undefined,
			flash: undefined,
			meta: undefined,
			error: {
				message: "",
			},
		};
		pages.set(ev, page);
	}
	return page;
}
