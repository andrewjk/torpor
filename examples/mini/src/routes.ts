import { type PageServerEndPoint, Site } from "@torpor/build";
import { ok } from "@torpor/build/response";

export default function addRoutes(site: Site) {
	site.addRoute("/", {
		// A .torp component file is used directly as the page component
		page: "./src/Counter.torp",
		// Inline server endpoint — this code stays out of the client bundle
		server: {
			actions: {
				set: async ({ request }) => {
					const data = await request.formData();
					const count = parseInt(data.get("count") as string);
					return ok({ message: `Server received count: ${count}` });
				},
			},
		} satisfies PageServerEndPoint,
	});
}
