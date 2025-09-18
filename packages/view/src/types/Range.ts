export default interface Range {
	startNode: ChildNode | null;
	endNode: ChildNode | null;

	children: Range[] | null;

	/**
	 * The index of the range if it is a branch in e.g. an if, switch or loop
	 */
	index: number;

	/**
	 * Animations that are currently running in the range, and which need to
	 * awaited or canceled before it is removed
	 */
	animations: Set<Animation> | null;
}
