import { type PageServerEndPoint, type ServerEndPoint, type ServerHook, Site } from "@torpor/build";
import { ok } from "@torpor/build/response";

export default function addRoutes(site: Site) {
	// Root: page, server (actions), layout, error, and hook — all in one call.
	// Each option maps to the corresponding file-route type (+page, +page.server,
	// _layout, _error, _hook.server).
	site.addRoute("/", {
		// A .torp component file used directly as the page component
		page: "./src/Counter.torp",
		// Inline page server endpoint — this code stays out of the client bundle
		pageServer: {
			actions: {
				set: async ({ request }) => {
					const data = await request.formData();
					const count = parseInt(data.get("count") as string);
					return ok({ message: `Server received count: ${count}` });
				},
			},
		} satisfies PageServerEndPoint,
		// Root layout — wraps every page in a <main> with a header
		layout: "./src/Layout.torp",
		// Error page — rendered when a route errors
		error: "./src/Error.torp",
		// Server hook — runs on every request before data loading
		hookServer: {
			enter: async (event) => {
				event.appData.hookRan = true;
			},
		} satisfies ServerHook,
	});

	// A JSON API endpoint (+server) with no page component
	site.addRoute("/api/time", {
		server: {
			get: async () => ok({ time: Date.now() }),
		} satisfies ServerEndPoint,
	});
}
