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
	 * Whether the plugin is running in a test context. Components are then
	 * compiled for the server by default, so tests can call them as functions
	 * and assert on the rendered HTML. To mount a component client-side in
	 * the same test project, import it with a `?client` query (e.g.
	 * `Component.torp?client`); the override is passed on to any components
	 * it imports. A `?server` query does the reverse.
	 */
	test?: boolean;
	/**
	 * Whether to preserve all whitespace text nodes from templates. Defaults to
	 * false (whitespace is trimmed Svelte 5-style). See BuildOptions.
	 */
	preserveWhitespace?: boolean;
}
