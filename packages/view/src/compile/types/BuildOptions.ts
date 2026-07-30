export default interface BuildOptions {
	/**
	 * Whether to create the component for server side rendering
	 */
	server?: boolean;
	/**
	 * Whether to create source maps
	 */
	mapped?: boolean;
	/**
	 * Whether to add debugging info etc for development mode
	 */
	dev?: boolean;
	/**
	 * If true, fragments will be built with calls to createElement etc. If
	 * false, fragments will be built with innerHTML. Using createElement is a
	 * bit slower, but may be useful in the future for rendering to different
	 * targets
	 */
	useCreateElement?: boolean;
	/**
	 * For internal testing and benchmarking
	 */
	renderFolder?: string;
	/**
	 * Whether to preserve all whitespace text nodes from the template.
	 * When false (the default), whitespace is trimmed Svelte 5-style:
	 * pure-whitespace nodes at the start/end of a container are removed,
	 * and pure-whitespace nodes between siblings are collapsed to a single
	 * space. Whitespace inside `pre`, `textarea`, and `code` is always kept.
	 */
	preserveWhitespace?: boolean;
}
