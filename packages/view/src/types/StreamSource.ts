import type Cleanup from "./Cleanup";

/**
 * A subscription to an external source of events — server-sent events,
 * WebSockets, DOM events, intervals, or anything else that pushes values
 * over time.
 *
 * The function is called with a `push` callback when the stream is
 * subscribed to (at mount time, and again whenever reactive state read
 * inside it changes). It wires the external source up to `push` and returns
 * a cleanup function that unsubscribes.
 *
 * Sources are never invoked during a server render, so browser-only APIs
 * (`EventSource`, `WebSocket`, DOM elements) are safe to reference inside
 * them.
 */
type StreamSource<T> = (push: (value: T) => void) => Cleanup | void;

export default StreamSource;
