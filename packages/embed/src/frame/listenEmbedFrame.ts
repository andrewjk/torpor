import scopeBridge from "../bridge/scopeBridge";
import type EmbedBridge from "../types/EmbedBridge";

const CHANNEL = "torpor-embed";

type FrameMessage =
	| { channel: string; kind: "event"; type: string; detail?: unknown }
	| { channel: string; kind: "invoke"; call: number; method: string; payload?: unknown }
	| { channel: string; kind: "height"; value: number };

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
}

export interface EmbedFrameListener {
	/**
	 * Stops listening for the frame's messages.
	 */
	dispose(): void;
}

/**
 * The host side of the frame protocol, usable on its own: listens for
 * messages from an iframe whose document was produced by `frameDocument()`
 * -- whether you mounted it with `mountEmbedFrame` or served it yourself
 * from a URL.
 *
 * The protocol (all messages carry `channel: "torpor-embed"`):
 * - frame -> host: `{ kind: "event", type, detail }`,
 *   `{ kind: "invoke", call, method, payload }`,
 *   `{ kind: "height", value }`
 * - host -> frame: `{ kind: "invoke-result", call, value }`,
 *   `{ kind: "invoke-error", call, message }`
 *
 * Security note: the frame has an opaque origin, so `event.origin` is
 * "null" and useless -- `event.source === iframe.contentWindow` is the
 * definitive check, and it is enforced here. Replies target `"*"`, which
 * is safe only because the frame's document is host-authored (runtime +
 * artifact + bootstrap). If a frame ever loads remote content, that
 * assumption breaks.
 */
export default function listenEmbedFrame(
	iframe: HTMLIFrameElement,
	options?: ListenEmbedFrameOptions,
): EmbedFrameListener {
	const bridge =
		options?.bridge &&
		scopeBridge(options.bridge, { artifactId: options?.artifactId ?? "unknown" });
	const maxHeight = options?.maxHeight;

	async function onMessage(event: MessageEvent): Promise<void> {
		if (event.source !== iframe.contentWindow) return;
		const data = event.data as FrameMessage;
		if (!data || data.channel !== CHANNEL) return;

		if (data.kind === "event") {
			bridge?.emit(data.type, data.detail);
		} else if (data.kind === "invoke") {
			const frame = iframe.contentWindow;
			try {
				const value = await bridge?.invoke(data.method, data.payload);
				frame?.postMessage(
					{ channel: CHANNEL, kind: "invoke-result", call: data.call, value },
					// The frame has an opaque origin, so "*" is the only usable
					// targetOrigin; its content is fully authored by us
					"*",
				);
			} catch (error) {
				frame?.postMessage(
					{
						channel: CHANNEL,
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
