import type EmbedBridge from "./EmbedBridge";

/**
 * Options for mounting an embed into a sandboxed iframe.
 */
export default interface EmbedFrameOptions {
	/**
	 * The source of the @torpor/view runtime bundle, as text. Import it with
	 * the ?raw query: `import runtime from "@torpor/view/runtime?raw"`. It
	 * is inlined into the frame's document. Provide this or `runtimeUrl`.
	 */
	runtime?: string;

	/**
	 * A URL the runtime bundle is served from, instead of inlining it: the
	 * browser caches one download for every frame on the page, which
	 * matters for feeds with many embeds. Relative URLs resolve against
	 * the host page's base. Note the URL must serve the same runtime
	 * version the artifact was compiled with.
	 */
	runtimeUrl?: string;

	/**
	 * The bridge the embed uses to emit events and call host APIs across
	 * the frame boundary via postMessage. Handlers receive the artifact id
	 * as `source`, same as in-process embeds. Invoke payloads must be
	 * serializable.
	 */
	bridge?: EmbedBridge;

	/**
	 * The iframe's sandbox attribute. Defaults to "allow-scripts", which
	 * gives the frame an opaque origin: it can run the embed's code but
	 * cannot touch the host page's DOM, storage, or cookies.
	 */
	sandbox?: string;

	/**
	 * The iframe's title, for accessibility.
	 */
	title?: string;
}
