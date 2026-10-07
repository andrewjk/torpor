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
	 * and assert on the rendered HTML (and `runTest`-style helpers can render
	 * a whole site). To mount a component client-side in the same test
	 * project, import it with a `?client` query (e.g. `Component.torp?client`);
	 * the override is passed on to any components it imports, including
	 * components from packages that ship `.torp` files (e.g. `@torpor/ui/*`
	 * or `phosphor-torpor/*`), whose re-export barrels get the query passed
	 * through as well.
	 *
	 * Server-rendering tests that import a `.torp` directly (rather than via
	 * `runTest`) should instead run in a Vite SSR environment, which compiles
	 * server-side without this flag and also resolves `@torpor/view` to its
	 * server runtime for shared `.ts`/`.js` modules -- see the README.
	 */
	test?: boolean;
	/**
	 * Whether to preserve all whitespace text nodes from templates. Defaults to
	 * false (whitespace is trimmed Svelte 5-style). See BuildOptions.
	 */
	preserveWhitespace?: boolean;
}
