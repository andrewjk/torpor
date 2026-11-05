import type EmbedEventSource from "./EmbedEventSource";

/**
 * The handlers a host app provides to `createBridge`. Embeds never see
 * these directly -- they see the `EmbedBridge` that wraps them.
 */
export default interface EmbedBridgeHandlers {
	/**
	 * Called when an embed emits an event.
	 *
	 * @param type The event type, e.g. "form-submitted"
	 * @param detail Arbitrary event payload
	 * @param source Which mounted artifact emitted the event
	 */
	onEvent?(type: string, detail: unknown, source: EmbedEventSource): void;

	/**
	 * Called when an embed invokes a host API, e.g. to submit a business
	 * form or fetch tenant data. Returned values (a bare value or a promise)
	 * are handed back to the embed.
	 *
	 * @param method The API name, e.g. "save-section-data"
	 * @param payload Arbitrary request payload
	 * @param source Which mounted artifact made the call
	 */
	invoke?(method: string, payload: unknown, source: EmbedEventSource): unknown;
}
