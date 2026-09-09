import path from "node:path";
import ServerEvent from "../server/ServerEvent.ts";
import Router from "../site/Router.ts";
import Site from "../site/Site";
import { createServerLoad } from "../site/serverHandlers.ts";

/**
 * Runs a site route in test mode
 * @param site The site configuration, with routing configured
 * @param route The route path e.g. `/home`
 * @param ev An optional ServerEvent, which you can use to set test cookies and headers
 * @returns An HTTP response containing the requested data, HTML, or error status
 */
export default async function runTest(
	site: Site,
	route: string,
	ev?: ServerEvent,
): Promise<Response> {
	if (!route.startsWith("/")) route += "/";
	if (!ev) {
		const req = new Request(`http://localhost${route}`);
		ev = new ServerEvent(req);
	}

	// Build the router from the Site object created by the user
	const router = new Router();
	router.addPages(
		site.routes.map((r) => ({
			path: r.path,
			type: r.type,
			endPoint: async () => {
				if (r.file) {
					const mod = await import(/* @vite-ignore */ path.join(site.root, r.file));
					// A .torp file's default export is a component, so wrap it as
					// a PageEndPoint ({ component }) for the entries
					if (r.file.endsWith(".torp")) {
						return { default: { component: mod.default } };
					}
					return mod;
				}
				// Inline endpoint (no file) — return directly from memory
				return { default: r.endPoint };
			},
			subFolder: r.subFolder,
		})),
	);

	// Run the request through the same handlers the site server uses, so the
	// test harness can never drift from production behavior
	return await createServerLoad(router)(ev, "%COMPONENT_BODY%");
}
