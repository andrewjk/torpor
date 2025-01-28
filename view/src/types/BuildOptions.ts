export type BuildOptions = {
	/**
	 * Whether to create the component for server side rendering
	 */
	server?: boolean;
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
};
