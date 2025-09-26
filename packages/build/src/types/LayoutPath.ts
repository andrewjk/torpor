// Store the current layout stack, so that we can re-use parts of it as necessary
export default interface LayoutPath {
	path: string;
	/** Whether to re-use this layout */
	reuse: boolean;
	/** Data loaded from endpoints that should be re-used */
	data: any;
	/** The range of the UI in this layout's slot */
	slotRange: any;
}
