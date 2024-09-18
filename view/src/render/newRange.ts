import type Range from "../types/Range";

export default function newRange(): Range {
	return {
		startNode: null,
		endNode: null,
		children: null,
		index: 0,
		effects: null,
		animations: null,
	};
}
