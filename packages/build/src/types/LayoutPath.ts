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
	 * The `$context` the layout passed to its slot, kept so a later
	 * navigation that reuses the layout can refill the slot with the same
	 * context (the layout itself isn't re-run, so it can't pass it again).
	 */
	context?: Record<PropertyKey, any>;
}
