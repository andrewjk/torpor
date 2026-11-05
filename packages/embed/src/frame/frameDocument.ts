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
	runtime: string;
}

/**
 * Builds the srcdoc for a sandboxed iframe embed: the runtime bundle, the
 * artifact's client code, the frame bootstrap, and the mount call.
 */
export default function frameDocument(input: FrameDocumentInput): string {
	const { artifact, props, runtime } = input;
	const styles = artifact.styles.map((s) => s.style).join("\n");
	return `<!doctype html>
<html>
<head>
${styles ? `<style>${styles}</style>` : ""}
</head>
<body>
<div id="torpor-embed"></div>
<script>${runtime};Object.assign(globalThis, TorporView);</script>
<script>${artifact.client.code}</script>
<script>${frameScript}</script>
<script>TorporEmbed.mount(${safeJson({ id: artifact.id, name: artifact.name, props })});</script>
</body>
</html>`;
}
