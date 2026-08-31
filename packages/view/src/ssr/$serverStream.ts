import type StreamSource from "../types/StreamSource";

/**
 * Server stub for `$stream` — external sources are never subscribed to
 * during a server render. The subscription starts when the component is
 * mounted on the client.
 */
export default function $serverStream<T>(
	_source: StreamSource<T>,
	_handler: (value: T) => void,
	_options?: { debounce?: number },
): void {}
