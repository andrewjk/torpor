export default interface Options {
	/**
	 * Whether to generate server components which will render HTML
	 */
	server?: boolean;
	/**
	 * Whether the plugin is running in a dev environment
	 */
	dev?: boolean;
	/**
	 * Whether the plugin is running in a test context
	 */
	test?: boolean;
}
