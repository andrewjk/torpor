/**
 * The host's bridge handlers. Embedded apps reach these from their client
 * handlers via `$props.$embed` (the loader injects the bridge as a reserved
 * prop). Template expressions can't call it — the restricted interpreter
 * never runs author code server-side — but the app's own event handlers are
 * ordinary client JS, and can store replies in `$watch` state.
 */
import { createBridge } from "@torpor/embed";

export interface Submission {
	app: string;
	text: string;
	at: string;
}

async function json(url: string, init?: RequestInit): Promise<any> {
	const reply = await fetch(url, init);
	return reply.json();
}

export const bridge = createBridge({
	invoke: async (method, payload) => {
		const body = (payload ?? {}) as { app?: string; text?: string; word?: string };

		// Apps submitting text (guest book signatures, suggested words)
		if (method === "submit") {
			return json("/api/submissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ app: body.app, text: body.text }),
			});
		}

		// The guest book's already-signed names
		if (method === "signatures") {
			const reply = await json("/api/submissions");
			const names = (reply?.submissions ?? [])
				.filter((entry: Submission) => entry.app === "guest-book")
				.map((entry: Submission) => entry.text);
			return { ok: true, names };
		}

		// A dictionary lookup, run server-side through the site's data policy
		if (method === "lookup") {
			const word = typeof body.word === "string" ? body.word : "";
			return json(`/api/lookup?word=${encodeURIComponent(word)}`);
		}

		return undefined;
	},
	onEvent: (type, detail) => {
		// Fire-and-forget events (analytics, notifications)
		console.log(`[embed] ${type}`, detail);
	},
});
