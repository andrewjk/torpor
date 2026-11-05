import type EmbedEventSource from "./EmbedEventSource";

/**
 * The bridge that an embed uses to talk back to its host app, injected by
 * the loader as the reserved `$embed` prop.
 *
 * Hosts create one with `createBridge` and pass it to `mountEmbed` /
 * `hydrateEmbed` via `options.bridge`. Data always flows through the host
 * (props in, events/API calls out) so embeds never get direct access to
 * host internals.
 */
export default interface EmbedBridge {
	/**
	 * Emits a fire-and-forget event to the host, e.g. notifying that a form
	 * was filled in. Errors thrown by the host's handler propagate to the
	 * embed.
	 *
	 * @param type The event type, e.g. "form-submitted"
	 * @param detail Arbitrary event payload
	 * @param source Set by the loader when it scopes a bridge to a mount;
	 * embeds should not pass this
	 */
	emit(type: string, detail?: unknown, source?: EmbedEventSource): void;

	/**
	 * Calls a host-provided API and waits for the result, e.g. submitting a
	 * business form or fetching data for the current tenant. Returns any so
	 * hand-written bridges and typed call sites both work; embeds can cast
	 * the result:
	 *
	 * `const data = await $props.$embed.invoke("fetch-data") as SectionData`
	 *
	 * @param method The API name, e.g. "save-section-data"
	 * @param payload Arbitrary request payload
	 * @param source Set by the loader when it scopes a bridge to a mount;
	 * embeds should not pass this
	 */
	invoke(method: string, payload?: unknown, source?: EmbedEventSource): Promise<any>;
}
