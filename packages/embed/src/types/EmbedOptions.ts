import type { SlotRender } from "@torpor/view";

/**
 * Options for mounting or hydrating an embed.
 */
export default interface EmbedOptions {
	/**
	 * Slots to pass to the embed's components.
	 */
	slots?: Record<string, SlotRender>;

	/**
	 * The version of @torpor/view that is running. When set, it is checked
	 * against the artifact's compiled version, and an EmbedVersionError is
	 * thrown if they don't match. Hosts that store embeds should always set
	 * this, so stale artifacts fail loudly instead of subtly breaking.
	 */
	runtimeVersion?: string;

	/**
	 * Log a warning and continue on a version mismatch instead of throwing.
	 */
	allowVersionMismatch?: boolean;

	/**
	 * Whether to inject the artifact's styles into the document. They are
	 * deduped by artifact id, and removed again on unmount. Default true.
	 */
	styles?: boolean;
}
