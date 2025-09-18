export default interface PageLoadEvent {
	/**
	 * The URL for the server function.
	 */
	url: URL;
	/**
	 * Route params from the URL and route path.
	 */
	params: Record<string, string>;
	/**
	 * Data that is (optionally) loaded from the load function and passed into the page as $props.data.
	 */
	data: Record<string, any>;
}
