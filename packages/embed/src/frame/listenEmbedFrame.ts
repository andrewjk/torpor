import scopeBridge from "../bridge/scopeBridge";
import type EmbedBridge from "../types/EmbedBridge";
import { EMBED_CHANNEL, type FrameToHost } from "./protocol";

export interface ListenEmbedFrameOptions {
	/**
	 * The artifact id reported to bridge handlers as the call's source.
	 * The host knows which embed it served; defaults to "unknown".
	 */
	artifactId?: string;

	/**
	 * The bridge the frame's embed talks to: events are forwarded to its
	 * `onEvent`, invokes resolved through its `invoke`. Same interface and
	 * scoping as in-process embeds.
	 */
	bridge?: EmbedBridge;

	/**
	 * Clamps the height the host applies from the frame's reports, so a
	 * runaway frame can't grow forever. Default: no limit.
	 */
	maxHeight?: number;

	/**
	 * The protocol channel to filter messages on. Must match the channel
	 * the frame's document was built with; mismatches fail silently
	 * (unknown channels are ignored). Defaults to `EMBED_CHANNEL`.
	 */
	channel?: string;
}

export interface EmbedFrameListener {
	/**
	 * Stops listening for the frame's messages.
	 */
	dispose(): void;
}

/**
 * The host side of the frame protocol (see src/frame/protocol.ts for the
 * message contract): listens for messages from an iframe whose document
 * contains `frameScript` or `frameBridgeScript` -- whether you mounted it
 * with `mountEmbedFrame` or served it yourself from a URL.
 */
export default function listenEmbedFrame(
	iframe: HTMLIFrameElement,
	options?: ListenEmbedFrameOptions,
): EmbedFrameListener {
	const bridge =
		options?.bridge &&
		scopeBridge(options.bridge, { artifactId: options?.artifactId ?? "unknown" });
	const maxHeight = options?.maxHeight;
	const channel = options?.channel ?? EMBED_CHANNEL;

	async function onMessage(event: MessageEvent): Promise<void> {
		if (event.source !== iframe.contentWindow) return;
		const data = event.data as FrameToHost;
		if (!data || data.channel !== channel) return;

		if (data.kind === "event") {
			bridge?.emit(data.type, data.detail);
		} else if (data.kind === "invoke") {
			const frame = iframe.contentWindow;
			try {
				const value = await bridge?.invoke(data.method, data.payload);
				frame?.postMessage(
					{ channel, kind: "invoke-result", call: data.call, value },
					// The frame has an opaque origin, so "*" is the only usable
					// targetOrigin; its content is fully authored by us
					"*",
				);
			} catch (error) {
				frame?.postMessage(
					{
						channel,
						kind: "invoke-error",
						call: data.call,
						message: error instanceof Error ? error.message : String(error),
					},
					"*",
				);
			}
		} else if (data.kind === "height") {
			const height = maxHeight !== undefined ? Math.min(data.value, maxHeight) : data.value;
			iframe.style.height = `${height}px`;
		}
	}

	window.addEventListener("message", onMessage);
	return {
		dispose() {
			window.removeEventListener("message", onMessage);
		},
	};
}
