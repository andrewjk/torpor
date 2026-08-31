import type StreamSource from "../types/StreamSource";

/**
 * The element to listen on, or a getter returning it. Use a getter for
 * `&ref`-bound variables — they are only assigned once the element is
 * created, and subscriptions start at mount time:
 *
 * ```torp
 * let saveButton: HTMLButtonElement;
 *
 * $stream(fromElement(() => saveButton, "click"), () => save());
 * ```
 */
type EventTargetInput = HTMLElement | (() => HTMLElement | null | undefined);

/**
 * Creates a StreamSource that pushes DOM events of the given type from an
 * element.
 *
 * ```torp
 * $stream(fromElement(() => saveButton, "click"), (e) => {
 * 	$state.clicks.push(e);
 * });
 * ```
 */
export default function fromElement<E extends Event = Event>(
	target: EventTargetInput,
	type: string,
): StreamSource<E> {
	return (push) => {
		const el = typeof target === "function" ? target() : target;
		if (!el) {
			throw new Error(
				'fromElement: element not found. When passing a &ref variable, wrap it in a getter: fromElement(() => buttonEl, "click")',
			);
		}
		const listener = push as EventListener;
		el.addEventListener(type, listener);
		return () => {
			el.removeEventListener(type, listener);
		};
	};
}
