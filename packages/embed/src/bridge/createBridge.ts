import type EmbedBridgeController from "../types/EmbedBridgeController";
import type EmbedBridgeHandlers from "../types/EmbedBridgeHandlers";
import type EmbedEventSource from "../types/EmbedEventSource";

/**
 * A subscriber registered through `on`, remembering which artifact
 * subscribed so the host can target pushes at a single artifact's embeds.
 */
interface Subscriber {
	handler: (detail: unknown) => void;
	artifactId?: string;
}

/**
 * Creates a bridge controller from host handlers. Pass it to
 * `mountEmbed` / `hydrateEmbed` via `options.bridge`; the loader scopes it
 * per mount so handlers know which artifact called them, and embeds see a
 * view without `push`.
 *
 * One bridge can be shared by every embed on a page (e.g. a feed with many
 * posts) -- handlers receive the emitting artifact's id as `source`, and
 * `push` can broadcast or target a single artifact.
 *
 * When no handler is connected for a call, the bridge warns once and
 * continues, so a host that forgets to wire up `onEvent` or `invoke` finds
 * out from the console instead of from silence.
 */
export default function createBridge(handlers: EmbedBridgeHandlers): EmbedBridgeController {
	let warnedEvent = false;
	let warnedInvoke = false;

	const noSource = (): EmbedEventSource => {
		console.warn(
			"[torpor/embed] A bridge call came from an embed that was not mounted with a scoped source. Did you mount it through mountEmbed/hydrateEmbed?",
		);
		return { artifactId: "unknown" };
	};

	// Push registry: type -> subscribers. Frame embeds subscribe here too,
	// via their host listener registering on their behalf.
	const subscribers = new Map<string, Set<Subscriber>>();

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

		invoke(method, payload, source) {
			if (!handlers.invoke) {
				if (!warnedInvoke) {
					warnedInvoke = true;
					console.warn(
						`[torpor/embed] Embed invoked "${method}", but no invoke handler is connected. Pass one to createBridge().`,
					);
				}
				// An unwired bridge resolves undefined for any method
				return Promise.resolve(undefined);
			}
			return Promise.resolve(handlers.invoke(method, payload, source ?? noSource()));
		},

		on(type, handler, source) {
			let set = subscribers.get(type);
			if (set === undefined) {
				set = new Set();
				subscribers.set(type, set);
			}
			const subscriber: Subscriber = { handler, artifactId: source?.artifactId };
			set.add(subscriber);
			return () => {
				set.delete(subscriber);
				if (set.size === 0) subscribers.delete(type);
			};
		},

		push(type, detail, artifactId) {
			const set = subscribers.get(type);
			if (set === undefined) return;
			for (const subscriber of set) {
				if (artifactId !== undefined && subscriber.artifactId !== artifactId) continue;
				subscriber.handler(detail);
			}
		},
	};
}
