export default interface ParseOptions {
	/**
	 * Treat capitalized tags that aren't imported or declared locally as
	 * components instead of reporting them as unknown.
	 *
	 * Hosts that supply components at runtime (the embed interpreter, the
	 * formatter) need this; normal compilation should leave it off so missing
	 * imports and typos are reported.
	 */
	allowUnknownComponents?: boolean;
}
