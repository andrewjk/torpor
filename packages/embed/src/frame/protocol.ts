/**
 * The frame protocol: the postMessage contract between a sandboxed frame
 * (whose document contains `frameScript` or `frameBridgeScript`) and the
 * host page (whose window runs `listenEmbedFrame`). This module is the
 * authoritative description; the scripts and the listener implement it.
 *
 * Security notes, since hosts re-implementing the protocol most often get
 * these wrong:
 *
 * - The frame has an opaque origin, so `event.origin` is "null" and
 *   useless. Validate `event.source` instead: the frame accepts only its
 *   direct parent; the host accepts only the frame's contentWindow.
 * - The host replies with targetOrigin "*", which is safe only because the
 *   frame's document is host-authored (runtime + artifact + bootstrap, or
 *   a frame document the host assembled itself). If a frame ever loads
 *   remote content, replies must stop using "*".
 * - Messages with an unknown channel are ignored, so a channel mismatch
 *   between the two sides fails silently by design.
 */
export const EMBED_CHANNEL = "torpor-embed";

/**
 * Frame -> host.
 */
export type FrameToHost =
	| { channel: string; kind: "event"; type: string; detail?: unknown }
	| { channel: string; kind: "invoke"; call: number; method: string; payload?: unknown }
	| { channel: string; kind: "height"; value: number }
	| { channel: string; kind: "subscribe"; type: string };

/**
 * Host -> frame.
 */
export type HostToFrame =
	| { channel: string; kind: "invoke-result"; call: number; value?: unknown }
	| { channel: string; kind: "invoke-error"; call: number; message: string }
	| { channel: string; kind: "push"; type: string; detail?: unknown };
