import { type ServerEndPoint, Site } from "@torpor/build";
import { ok } from "@torpor/build/response";

export default function addRoutes(site: Site) {
	// A JSON API endpoint (+server) with no page component
	site.addRoute("/", {
		server: {
			get: async () => ok({ time: Date.now() }),
		} satisfies ServerEndPoint,
	});
}
