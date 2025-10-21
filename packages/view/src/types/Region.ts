export default interface Region {
	startNode: ChildNode | null;
	endNode: ChildNode | null;

	previousRegion: Region | null;
	nextRegion: Region | null;
	depth: number;

	/**
	 * Animations that are currently running in the region, and which need to
	 * awaited or canceled before it is removed
	 */
	animations: Set<Animation> | null;

	/**
	 * The name of the region, for debugging.
	 */
	name?: string;
}
