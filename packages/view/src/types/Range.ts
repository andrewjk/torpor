export default interface Range {
	startNode: ChildNode | null;
	endNode: ChildNode | null;

	previousRange: Range | null;
	nextRange: Range | null;
	depth: number;

	/**
	 * Animations that are currently running in the range, and which need to
	 * awaited or canceled before it is removed
	 */
	animations: Set<Animation> | null;

	/**
	 * The name of the range, for debugging.
	 */
	name?: string;
}
