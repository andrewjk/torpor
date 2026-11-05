import type EmbedBridge from "./EmbedBridge";

/**
 * Options for mounting an embed into a sandboxed iframe.
 */
export default interface EmbedFrameOptions {
	/**
	 * The source of the @torpor/view runtime bundle, as text. Import it with
	 * the ?raw query: `import runtime from "@torpor/view/runtime?raw"`. It is
	 * inlined into the frame's document, so keep the runtime and the
	 * compiler that built the artifact in lockstep (build both from the same
	 * workspace).
	 */
	runtime: string;

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
