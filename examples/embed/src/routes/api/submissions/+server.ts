import { type ServerEndPoint } from "@torpor/build";
import { addSubmission, listSubmissions } from "@/lib/submissions";

function json(value: unknown, status = 200): Response {
	return new Response(JSON.stringify(value), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * Bridge target: `$props.$embed.invoke("submit", { app, text })` lands here.
 * Validates, stores, and answers with { ok, count } for the app to display.
 */
export default {
	get: () => json({ submissions: listSubmissions() }),
	post: async (event) => {
		try {
			const entry = addSubmission((await event.json()) as { app?: unknown; text?: unknown });
			return json({ ok: true, entry, count: listSubmissions().length });
		} catch (error) {
			return json({ ok: false, error: String((error as Error).message ?? error) }, 400);
		}
	},
} satisfies ServerEndPoint;
