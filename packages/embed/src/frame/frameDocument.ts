import frameScript from "./frameScript";
import type EmbedArtifact from "../types/EmbedArtifact";

/**
 * Escapes JSON for embedding inside a <script> element: closing script tags
 * and HTML comments are escaped, as are the line separators that are valid
 * JSON but not valid JavaScript string content.
 */
export function safeJson(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

export interface FrameDocumentInput {
	artifact: Pick<EmbedArtifact, "id" | "name" | "client" | "styles">;
	props: Record<string, any>;
	/**
	 * The runtime bundle source, inlined into the frame's document.
	 */
	runtime?: string;
	/**
	 * A URL the runtime bundle is served from, instead of inlining it:
	 * the browser caches one download for every frame on the page, which
	 * matters for feeds with many embeds. Relative URLs resolve against
	 * the host page's base.
	 */
	runtimeUrl?: string;
	/**
	 * The host's own CSS (theme custom properties, base styles), injected
	 * before the artifact's styles so the embed can still override. This
	 * is how a sandboxed frame inherits the host's look-and-feel.
	 */
	css?: string | string[];

	/**
	 * A CSP nonce applied to the document's `<script>` and `<style>` tags.
	 */
	nonce?: string;
}

/**
 * Escapes a URL for use inside a double-quoted attribute.
 */
export function safeAttribute(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Builds the srcdoc for a sandboxed iframe embed: the runtime bundle, the
 * artifact's client code, the frame bootstrap, and the mount call.
 */
export default function frameDocument(input: FrameDocumentInput): string {
	const { artifact, props } = input;
	const hostCss =
		input.css === undefined ? "" : Array.isArray(input.css) ? input.css.join("\n") : input.css;
	const styles = artifact.styles.map((s) => s.style).join("\n");
	const head = [hostCss, styles].filter((css) => css.length > 0);
	const nonce = input.nonce !== undefined ? ` nonce="${safeAttribute(input.nonce)}"` : "";
	// A classic <script src> blocks the scripts after it, so the runtime is
	// always defined before the artifact code and bootstrap run
	const runtimeTag = input.runtimeUrl
		? `<script${nonce} src="${safeAttribute(input.runtimeUrl)}"></script>`
		: `<script${nonce}>${input.runtime};Object.assign(globalThis, TorporView);</script>`;
	return `<!doctype html>
<html>
<head>
${head.length > 0 ? `<style${nonce}>${head.join("\n")}</style>` : ""}
</head>
<body>
<div id="torpor-embed"></div>
${runtimeTag}
<script${nonce}>${artifact.client.code}</script>
<script${nonce}>${frameScript}</script>
<script${nonce}>TorporEmbed.mount(${safeJson({ id: artifact.id, name: artifact.name, props })});</script>
</body>
</html>`;
}
