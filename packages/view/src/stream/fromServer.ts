import type StreamSource from "../types/StreamSource";

/**
 * Creates a StreamSource that receives `message` events from a server-sent
 * events endpoint. The URL may be a getter, so reactive state can be read
 * inside it — when it changes, the connection is closed and re-opened:
 *
 * ```torp
 * $stream(fromServer(`/sse/${$props.id}`), (e) => {
 * 	$state.messages.push(e.data);
 * });
 * ```
 *
 * Reconnection is handled by `EventSource` itself; errors are not pushed —
 * a source that can fail should surface errors as values.
 */
export default function fromServer(url: string | (() => string)): StreamSource<MessageEvent> {
	return (push) => {
		const eventSource = new EventSource(typeof url === "function" ? url() : url);
		eventSource.onmessage = push;
		return () => {
			eventSource.close();
		};
	};
}
