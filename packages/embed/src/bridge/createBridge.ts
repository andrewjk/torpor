import type EmbedBridge from "../types/EmbedBridge";
import type EmbedBridgeHandlers from "../types/EmbedBridgeHandlers";
import type EmbedEventSource from "../types/EmbedEventSource";

/**
 * Creates an `EmbedBridge` from host handlers. Pass the result to
 * `mountEmbed` / `hydrateEmbed` via `options.bridge`; the loader scopes it
 * per mount so handlers know which artifact called them.
 *
 * One bridge can be shared by every embed on a page (e.g. a feed with many
 * posts) -- handlers receive the emitting artifact's id as `source`.
 *
 * When no handler is connected for a call, the bridge warns once and
 * continues, so a host that forgets to wire up `onEvent` or `invoke` finds
 * out from the console instead of from silence.
 */
export default function createBridge(handlers: EmbedBridgeHandlers): EmbedBridge {
	let warnedEvent = false;
	let warnedInvoke = false;

	const noSource = (): EmbedEventSource => {
		console.warn(
			"[torpor/embed] A bridge call came from an embed that was not mounted with a scoped source. Did you mount it through mountEmbed/hydrateEmbed?",
		);
		return { artifactId: "unknown" };
	};

	return {
		emit(type, detail, source) {
			if (!handlers.onEvent) {
				if (!warnedEvent) {
					warnedEvent = true;
					console.warn(
						`[torpor/embed] Embed emitted event "${type}", but no onEvent handler is connected. Pass one to createBridge().`,
					);
				}
				return;
			}
			handlers.onEvent(type, detail, source ?? noSource());
		},

		invoke<T>(method: string, payload?: unknown, source?: EmbedEventSource): Promise<T> {
			if (!handlers.invoke) {
				if (!warnedInvoke) {
					warnedInvoke = true;
					console.warn(
						`[torpor/embed] Embed invoked "${method}", but no invoke handler is connected. Pass one to createBridge().`,
					);
				}
				// An unwired bridge resolves undefined for any method
				return Promise.resolve(undefined) as Promise<T>;
			}
			return Promise.resolve(handlers.invoke(method, payload, source ?? noSource()) as T);
		},
	};
}
