import type Range from "../types/Range";

export default function newRange(name?: string): Range {
	return {
		startNode: null,
		endNode: null,
		previousRange: null,
		nextRange: null,
		children: 0,
		animations: null,
		name,
	};
}
