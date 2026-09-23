import { ERROR_ROUTE } from "../types/RouteType";
import type Router from "./Router";

/**
 * Finds the path of the nearest error route for a request path: the error
 * route whose base (its path with the `/_error` suffix stripped) is the
 * longest prefix of the request path. E.g. an error route added with
 * `addRoute("/admin", { error })` handles `/admin/nope`, while everything
 * else falls back to the root `/_error`.
 *
 * Returns undefined when the site has no matching error route.
 */
export default function findErrorRoute(router: Router, path: string): string | undefined {
	let best: { path: string; length: number } | undefined = undefined;
	for (const route of router.routes) {
		if (route.handler.type !== ERROR_ROUTE) continue;
		const base = route.handler.path.replace(/\/_error$/, "");
		const matches = base === "" || path === base || path.startsWith(base + "/");
		if (matches && (best === undefined || base.length > best.length)) {
			best = { path: route.handler.path, length: base.length };
		}
	}
	return best?.path;
}
