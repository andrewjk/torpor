import { type ServerEndPoint } from "@torpor/build";
import { getApp, renderApp } from "@/lib/store";

function json(value: unknown, status = 200): Response {
	return new Response(JSON.stringify(value), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * The embeddable fragment: `GET /render?id=X&<props>` returns everything a
 * page needs to inject and hydrate the app.
 */
export default {
	get: async (event) => {
		const url = new URL(event.url);
		const app = getApp(url.searchParams.get("id") ?? "");
		if (app === undefined) return json({ error: "Unknown app" }, 404);
		const props: Record<string, string> = { ...app.manifest.props } as Record<string, string>;
		for (const [key, value] of url.searchParams) {
			if (key !== "id") props[key] = value;
		}
		try {
			const rendered = await renderApp(app, props);
			return json({
				html: rendered.body,
				head: rendered.head,
				styles: rendered.styles,
				data: rendered.data,
				props: rendered.props,
			});
		} catch (error) {
			return json({ error: String((error as Error).message ?? error) }, 502);
		}
	},
} satisfies ServerEndPoint;
