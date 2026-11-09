import { type ServerEndPoint } from "@torpor/build";
import { getApp } from "@/lib/store";

/** The compiled artifact a page hydrates from */
export default {
	get: (event) => {
		const app = getApp(new URL(event.url).searchParams.get("id") ?? "");
		if (app === undefined) {
			return new Response(JSON.stringify({ error: "Unknown app" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response(JSON.stringify(app.artifact), {
			headers: { "Content-Type": "application/json" },
		});
	},
} satisfies ServerEndPoint;
