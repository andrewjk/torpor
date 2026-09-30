import { type ServerEndPoint, Site } from "@torpor/build";
import { ok } from "@torpor/build/response";

export default function addRoutes(site: Site) {
	// A page (wrapped in a layout, with an error page) rendered in the Electron
	// window. The initial HTML is server-rendered, then hydrated in the renderer
	site.addRoute("/", {
		page: "./src/App.torp",
		layout: "./src/Layout.torp",
		error: "./src/Error.torp",
	});

	// Server code runs in the Electron main process (Node), so it can read
	// things the renderer can't -- here, process info. The page fetches this
	// endpoint on mount to show that requests really go through Node
	site.addRoute("/api/info", {
		server: {
			get: async () =>
				ok({
					platform: process.platform,
					arch: process.arch,
					node: process.version,
					pid: process.pid,
				}),
		} satisfies ServerEndPoint,
	});
}
