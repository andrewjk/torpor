import type EmbedBridge from "./EmbedBridge";

/**
 * What `createBridge` returns: the `EmbedBridge` embeds see, plus the
 * host-side `push`. Embeds receive the loader's *scoped* view of the
 * bridge, which omits `push` — subscribing (`on`) is the embed's job,
 * deciding what to push is the host's.
 */
export default interface EmbedBridgeController extends EmbedBridge {
	/**
	 * Pushes data into mounted embeds. Delivers to every embed subscribed
	 * to `type` — or, with `artifactId`, only to that artifact's embeds.
	 * With no subscribers, a push is a silent no-op. The embed's `on`
	 * handler runs in the embed; updating `$watch` state there re-renders
	 * it reactively.
	 *
	 * @param type The push type the embed subscribed to
	 * @param detail The payload handed to the embed's `on` handler
	 * @param artifactId Deliver only to this artifact's embeds
	 */
	push(type: string, detail?: unknown, artifactId?: string): void;
}
