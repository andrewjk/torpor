import type ListItem from "../types/ListItem";

export default function newListItem(data: Record<PropertyKey, any>, key?: any): ListItem {
	return {
		startNode: null,
		endNode: null,
		previousRegion: null,
		nextRegion: null,
		depth: -1,
		animations: null,
		data,
		key,
	};
}
