import frameDocument from "./frameDocument";
import listenEmbedFrame, { type EmbedFrameListener } from "./listenEmbedFrame";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedFrameHandle from "../types/EmbedFrameHandle";
import type EmbedFrameOptions from "../types/EmbedFrameOptions";

/**
 * Mounts an embed artifact into a sandboxed iframe, for authors you don't
 * trust: the frame gets `sandbox="allow-scripts"` (an opaque origin that
 * can't touch the host page's DOM, storage, or cookies), and the embed's
 * events and API calls cross the boundary over postMessage using the same
 * `EmbedBridge` interface as in-process embeds.
 *
 * The frame's document is fully authored by you (runtime + artifact code +
 * bootstrap), so the embed's code can only be what you compiled -- it can't
 * load anything else.
 *
 * Invoke payloads and props cross the boundary as structured clone, so they
 * must be serializable data. Scope values (host components) are functions
 * and cannot cross at all -- sandboxed frames use slots and the bridge.
 */
export default function mountEmbedFrame(
	iframe: HTMLIFrameElement,
	artifact: EmbedArtifact,
	props: Record<string, any> = {},
	options: EmbedFrameOptions,
): EmbedFrameHandle {
	if ((options.runtime !== undefined) === (options.runtimeUrl !== undefined)) {
		throw new Error(
			'mountEmbedFrame needs exactly one of { runtime } (the bundle source, e.g. import runtime from "@torpor/view/runtime?raw") or { runtimeUrl } (a URL the runtime bundle is served from).',
		);
	}
	if ((options as { scope?: unknown }).scope !== undefined) {
		throw new Error(
			"Scope values (host components) are functions and cannot cross the frame boundary. Sandboxed frames use slots and the bridge instead.",
		);
	}

	// jsdom doesn't implement iframe.sandbox (DOMTokenList); the attribute works everywhere
	iframe.setAttribute("sandbox", options.sandbox ?? "allow-scripts");
	if (options.title) iframe.title = options.title;
	iframe.srcdoc = frameDocument({
		artifact,
		props,
		runtime: options.runtime,
		runtimeUrl: options.runtimeUrl,
		css: options.css,
		nonce: options.nonce,
		channel: options.channel,
	});

	const listener: EmbedFrameListener = listenEmbedFrame(iframe, {
		bridge: options.bridge,
		artifactId: artifact.id,
		maxHeight: options.maxHeight,
		channel: options.channel,
	});

	return {
		iframe,
		unmount() {
			listener.dispose();
			// Stop the frame from running: clearing srcdoc unloads its document
			iframe.removeAttribute("srcdoc");
		},
	};
}
