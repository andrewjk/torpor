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
	const styles = artifact.styles.map((s) => s.style).join("\n");
	// A classic <script src> blocks the scripts after it, so the runtime is
	// always defined before the artifact code and bootstrap run
	const runtimeTag = input.runtimeUrl
		? `<script src="${safeAttribute(input.runtimeUrl)}"></script>`
		: `<script>${input.runtime};Object.assign(globalThis, TorporView);</script>`;
	return `<!doctype html>
<html>
<head>
${styles ? `<style>${styles}</style>` : ""}
</head>
<body>
<div id="torpor-embed"></div>
${runtimeTag}
<script>${artifact.client.code}</script>
<script>${frameScript}</script>
<script>TorporEmbed.mount(${safeJson({ id: artifact.id, name: artifact.name, props })});</script>
</body>
</html>`;
}
