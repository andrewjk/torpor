import context from "../render/context";
import type StreamSource from "../types/StreamSource";
import $run from "./$run";

/**
 * Subscribes to an external source of events — server-sent events,
 * WebSockets, DOM events, or any custom `StreamSource` — and calls
 * `handler` for each event it pushes. Events are typically written into
 * reactive state, which keeps templates, computeds and effects updating
 * through the normal reactivity model:
 *
 * ```torp
 * let $state = $watch({ messages: [] as string[] });
 *
 * $stream(fromServer(`/sse/${$props.id}`), (e) => {
 * 	$state.messages.push(e.data);
 * });
 * ```
 *
 * The subscription is managed by the framework:
 *
 * - It starts when the component is mounted to the DOM (so `&ref`-bound
 *   elements are available), and is unsubscribed when the component
 *   unmounts or its region is cleared.
 * - Reactive state read *inside* the source is tracked: when it changes,
 *   the source is unsubscribed and re-subscribed with fresh values (e.g.
 *   re-opening a connection when a user id changes). A pending debounced
 *   call is dropped on re-subscribe.
 * - The source is never invoked during a server render, so browser-only
 *   APIs are safe to use.
 *
 * Errors are values like any other: a source that can fail should push an
 * error-shaped value and own its own reconnection (e.g. `EventSource`
 * reconnects automatically).
 *
 * @param source The stream source to subscribe to
 * @param handler Called for each event the source pushes
 * @param options Timing options. `debounce` delays each handler call until
 *   the source has been quiet for that many milliseconds, resetting on
 *   every event (only the last event in a burst is handled).
 */
export default function $stream<T>(
	source: StreamSource<T>,
	handler: (value: T) => void,
	options?: { debounce?: number },
): void {
	context.mountEffects.push(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;

		// Mount callbacks are once-only and untracked, so the source is set
		// up inside a `$run`: reactive state it reads is tracked, and when it
		// changes the source is unsubscribed and re-subscribed with fresh
		// values. The debounce timer lives outside the effect so re-runs
		// share it; the effect's cleanup drops any pending call.
		$run(() => {
			const unsub = source((value) => {
				if (options?.debounce) {
					clearTimeout(timer);
					timer = setTimeout(() => handler(value), options.debounce);
				} else {
					handler(value);
				}
			});

			return () => {
				unsub?.();
				clearTimeout(timer);
			};
		});
	});
}
