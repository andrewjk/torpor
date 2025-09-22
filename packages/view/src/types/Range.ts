export default interface Range {
	startNode: ChildNode | null;
	endNode: ChildNode | null;

	previousRange: Range | null;
	nextRange: Range | null;
	lastRange: Range | null;
	children: number;

	/**
	 * Animations that are currently running in the range, and which need to
	 * awaited or canceled before it is removed
	 */
	animations: Set<Animation> | null;
}
