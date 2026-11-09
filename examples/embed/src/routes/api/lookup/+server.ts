import { type ServerEndPoint } from "@torpor/build";
import { policy } from "@/lib/store";
import { addSubmission } from "@/lib/submissions";

const WORDS_URL = "https://api.datamuse.com/words";
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: { word: string; defs: string[] } }>();

function json(value: unknown, status = 200): Response {
	return new Response(JSON.stringify(value), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * Bridge target: `$props.$embed.invoke("lookup", { word })`. Resolves the
 * definition through the site's own data policy (the same `createHttpSource`
 * the rendered requirements use), records the looked-up word, and answers
 * with `{ ok, word, defs }` for the app to display.
 */
export default {
	get: async (event) => {
		const url = new URL(event.url);
		const word = (url.searchParams.get("word") ?? "").trim();
		if (!/^[\p{L}][\p{L}' -]{0,60}$/u.test(word)) {
			return json({ ok: false, error: "Enter a single word." }, 400);
		}
		const hit = cache.get(word.toLowerCase());
		if (hit && Date.now() - hit.at < CACHE_TTL) {
			return json({ ok: true, ...hit.value });
		}
		try {
			const entry = (await policy.http(
				{
					url: WORDS_URL,
					params: { sp: word, md: "d", max: 1 },
					pick: "0",
					limit: 1,
				},
				{ artifactId: "lookup", props: {} },
			)) as { word?: string; defs?: unknown } | undefined;
			const defs = Array.isArray(entry?.defs)
				? entry.defs.filter((def): def is string => typeof def === "string")
				: [];
			const value = { word: entry?.word ?? word, defs };
			cache.set(word.toLowerCase(), { at: Date.now(), value });
			// The submission log doubles as a lookup history
			addSubmission({ app: "word-lookup", text: value.word });
			return json({ ok: true, ...value });
		} catch (error) {
			return json({ ok: false, error: String((error as Error).message ?? error) }, 502);
		}
	},
} satisfies ServerEndPoint;
