import type StreamSource from "../types/StreamSource";

/**
 * Creates a StreamSource that receives `message` events from a WebSocket.
 * The URL may be a getter, so reactive state can be read inside it — when
 * it changes, the socket is closed and re-opened:
 *
 * ```torp
 * $stream(fromWebSocket(`/ws/${$props.id}`), (e) => {
 * 	$state.inbox.push(e.data);
 * });
 * ```
 *
 * Errors are not pushed — a source that can fail should surface errors as
 * values and own its own reconnection.
 */
export default function fromWebSocket(url: string | (() => string)): StreamSource<MessageEvent> {
	return (push) => {
		const socket = new WebSocket(typeof url === "function" ? url() : url);
		socket.onmessage = push;
		return () => {
			socket.close();
		};
	};
}
