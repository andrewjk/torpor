export default interface PageState {
	status: number;
	url: URL;
	form?: Record<string, string | number>;
	/**
	 * Static data the page declares for its layouts, from `meta` on the
	 * page's endpoint (`+page.ts`), e.g. `meta: { bare: true }`. Replaced on
	 * every navigation, so a layout can branch on it (`$page.meta.bare`)
	 * without the page having to run a load. See also `data`, which carries
	 * the loads' output -- the same values in every layout's `$props.data`.
	 */
	meta?: Record<string, any>;
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
