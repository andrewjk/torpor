import scopeBridge from "../bridge/scopeBridge";
import type EmbedArtifact from "../types/EmbedArtifact";
import type EmbedFrameHandle from "../types/EmbedFrameHandle";
import type EmbedFrameOptions from "../types/EmbedFrameOptions";
import frameDocument from "./frameDocument";

const CHANNEL = "torpor-embed";

type FrameMessage =
	| { channel: string; kind: "event"; type: string; detail?: unknown }
	| { channel: string; kind: "invoke"; call: number; method: string; payload?: unknown }
	| { channel: string; kind: "height"; value: number };

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
 * must be serializable data.
 */
export default function mountEmbedFrame(
	iframe: HTMLIFrameElement,
	artifact: EmbedArtifact,
	props: Record<string, any> = {},
	options: EmbedFrameOptions,
): EmbedFrameHandle {
	if (typeof options?.runtime !== "string" || options.runtime.length === 0) {
		throw new Error(
			'mountEmbedFrame needs the runtime bundle source. Import it: import runtime from "@torpor/view/runtime?raw", then pass { runtime }.',
		);
	}

	// jsdom doesn't implement iframe.sandbox (DOMTokenList); the attribute works everywhere
	iframe.setAttribute("sandbox", options.sandbox ?? "allow-scripts");
	if (options.title) iframe.title = options.title;
	iframe.srcdoc = frameDocument({ artifact, props, runtime: options.runtime });

	const bridge = options.bridge
		? scopeBridge(options.bridge, { artifactId: artifact.id })
		: undefined;

	function replyToFrame(frame: Window | null, message: Record<string, unknown>): void {
		// The frame has an opaque origin, so "*" is the only usable
		// targetOrigin; its content is fully authored by us (runtime +
		// artifact + bootstrap), which is what makes that safe.
		frame?.postMessage({ channel: CHANNEL, ...message }, "*");
	}

	async function onMessage(event: MessageEvent): Promise<void> {
		// With a sandboxed (opaque-origin) frame, event.origin is "null" and
		// useless; event.source is the definitive check
		if (event.source !== iframe.contentWindow) return;
		const data = event.data as FrameMessage;
		if (!data || data.channel !== CHANNEL) return;

		if (data.kind === "event") {
			bridge?.emit(data.type, data.detail);
		} else if (data.kind === "invoke") {
			try {
				const value = await bridge?.invoke(data.method, data.payload);
				replyToFrame(iframe.contentWindow, {
					kind: "invoke-result",
					call: data.call,
					value,
				});
			} catch (error) {
				replyToFrame(iframe.contentWindow, {
					kind: "invoke-error",
					call: data.call,
					message: error instanceof Error ? error.message : String(error),
				});
			}
		} else if (data.kind === "height") {
			iframe.style.height = `${data.value}px`;
		}
	}

	window.addEventListener("message", onMessage);

	return {
		iframe,
		unmount() {
			window.removeEventListener("message", onMessage);
			// Stop the frame from running: clearing srcdoc unloads its document
			iframe.removeAttribute("srcdoc");
		},
	};
}
