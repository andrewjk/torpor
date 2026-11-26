// Store the current layout stack, so that we can re-use parts of it as necessary
export default interface LayoutPath {
	path: string;
	/** Whether to re-use this layout */
	reuse: boolean;
	/** Data loaded from endpoints that should be re-used */
	data: any;
	/** The range of the UI in this layout's slot */
	slotRegion: any;
	/**
	 * The `$props` object this layout's component was created with. Kept
	 * reactive, so a navigation that reuses the layout can point its `data`
	 * (and `form`) at the new page's values -- otherwise the layout would keep
	 * the first page's data forever, while the server (which re-renders the
	 * layout for every request) shows the current page's.
	 */
	props?: Record<PropertyKey, any>;
	/**
	 * The `$context` the layout passed to its slot, kept so a later
	 * navigation that reuses the layout can refill the slot with the same
	 * context (the layout itself isn't re-run, so it can't pass it again).
	 */
	context?: Record<PropertyKey, any>;
}
