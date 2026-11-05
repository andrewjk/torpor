import type EmbedBridge from "../types/EmbedBridge";
import type EmbedEventSource from "../types/EmbedEventSource";

/**
 * Returns a view of the bridge whose calls are stamped with the given
 * source, so a bridge shared by many embeds knows which artifact is
 * calling. This is how mountEmbed/hydrateEmbed scope a host bridge to each
 * mounted artifact.
 */
export default function scopeBridge(bridge: EmbedBridge, source: EmbedEventSource): EmbedBridge {
	return {
		emit: (type, detail) => bridge.emit(type, detail, source),
		invoke: (method, payload) => bridge.invoke(method, payload, source),
	};
}
