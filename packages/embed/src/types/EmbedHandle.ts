/**
 * A handle for a mounted or hydrated embed, so hosts can tear it down again
 * (e.g. removing a post from a feed).
 */
export default interface EmbedHandle {
	/**
	 * Unmounts the embed and removes its styles.
	 */
	unmount(): void;
}
