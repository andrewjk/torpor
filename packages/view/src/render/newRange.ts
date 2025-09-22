import type Range from "../types/Range";

export default function newRange(): Range {
	return {
		startNode: null,
		endNode: null,
		previousRange: null,
		nextRange: null,
		lastRange: null,
		children: 0,
		index: 0,
		animations: null,
	};
}
