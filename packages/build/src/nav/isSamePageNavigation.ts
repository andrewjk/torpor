import { getBasePath, stripBaseFromUrl } from "../site/basePath.ts";
import $page from "../state/$page.ts";

/**
 * Whether a url change stayed on the page that's on screen: same path and
 * query as the one `$page.url` holds, with (at most) a different `#hash`.
 *
 * A fragment navigation within the current document — a `#hash` link click,
 * or back/forward between two hash entries — fires `popstate` just like a
 * page change does, but the browser owns it: it has already moved the
 * history entry and scrolled to the target anchor itself. Re-rendering for
 * it would rebuild the page and restore the saved (or default) scroll
 * position, undoing the jump.
 */
export default function isSamePageNavigation(location: Location): boolean {
	const url = stripBaseFromUrl(new URL(location.href), getBasePath());
	// Not under the site's base path: not the page that's showing
	if (!url) return false;
	return url.pathname === $page.url.pathname && url.search === $page.url.search;
}
