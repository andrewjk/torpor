import { type ServerEndPoint } from "@torpor/build";
import type { AppManifest } from "@torpor/embed/app";
import { deploy } from "@/lib/store";

/**
 * Deployment: `POST /artifacts { id, source, props?, data? }` compiles the
 * restricted .torp at save time and stores it — the site never changes.
 */
export default {
	post: async (event) => {
		const body = (await event.json()) as AppManifest & { source?: string };
		if (!body?.id || typeof body.source !== "string") {
			return new Response(JSON.stringify({ error: "Expected { id, source, props?, data? }" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
		try {
			const app = deploy(body, body.source);
			return new Response(JSON.stringify({ id: app.id, name: app.name }), {
				headers: { "Content-Type": "application/json" },
			});
		} catch (error) {
			return new Response(JSON.stringify({ error: String((error as Error).message ?? error) }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
	},
} satisfies ServerEndPoint;
