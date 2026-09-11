export default interface PageState {
	status: number;
	url: URL;
	form?: Record<string, string | number>;
	error?: {
		message: string;
	};
	/**
	 * One-shot values from the last action (set via `event.flash`), shown
	 * by the render and consumed with it -- commonly `{ message }` or
	 * `{ type, message }` for a styled banner -- see /build/actions
	 */
	flash?: Record<string, unknown>;
}
