import type Effect from "./Effect";

export default interface Range {
	startNode: ChildNode | null;
	endNode: ChildNode | null;

	parent: Range | null;
	children: Range[] | null;

	/**
	 * The index of the range if it is a branch in e.g. an if, switch or loop
	 */
	index: number;

	/**
	 * The effects that have been run in this range, and which need to be
	 * cleaned up when it is removed
	 */
	effects: Effect[] | null;
}
