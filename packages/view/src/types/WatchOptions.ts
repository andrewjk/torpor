/**
 * Options for $watch.
 */
export default interface WatchOptions {
	/**
	 * Only watch top-level properties, don't recursively watch children.
	 */
	shallow?: boolean;
}
