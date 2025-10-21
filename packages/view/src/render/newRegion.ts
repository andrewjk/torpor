import type Region from "../types/Region";

export default function newRegion(name?: string): Region {
	return {
		startNode: null,
		endNode: null,
		previousRegion: null,
		nextRegion: null,
		depth: -1,
		animations: null,
		name,
	};
}
