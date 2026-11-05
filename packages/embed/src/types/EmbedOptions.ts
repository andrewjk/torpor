import type { SlotRender } from "@torpor/view";
import type EmbedBridge from "./EmbedBridge";

/**
 * Options for mounting or hydrating an embed.
 */
export default interface EmbedOptions {
	/**
	 * Slots to pass to the embed's components.
	 */
	slots?: Record<string, SlotRender>;

	/**
	 * The bridge the embed uses to emit events and call host APIs. It is
	 * scoped to this mount (calls are stamped with the artifact id) and
	 * injected as the reserved `$embed` prop, unless props already contain
	 * `$embed`. When omitted, a default bridge that warns on first use is
	 * injected, so unwired embeds fail loudly in the console.
	 */
	bridge?: EmbedBridge;

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

	/**
	 * A CSP nonce for the injected `<style>` element, when the host's
	 * policy uses style-src nonces.
	 */
	nonce?: string;

	/**
	 * Cache the evaluated component on the artifact object, so mounting the
	 * same artifact many times (a feed of posts, a dashboard of sections)
	 * evaluates its code once. Keyed by artifact object identity, not
	 * content -- refetching the same artifact produces a new cache entry.
	 * Default false.
	 */
	cache?: boolean;

	/**
	 * Host modules the embed may import, keyed by the specifier used in the
	 * embed's source: `{ "@example/ui": uiModule }`. The loader flattens
	 * each module's keys into the identifiers the compiled code can
	 * reference, and fails loudly (naming the missing bindings) if the
	 * artifact imports something not provided. Scope values cannot cross
	 * the iframe boundary -- sandboxed frames use slots and the bridge.
	 */
	scope?: Record<string, unknown>;
}
