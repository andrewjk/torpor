import type ListItem from "../types/ListItem";

export default function newListItem(
	data: Record<PropertyKey, any>,
	index: number,
	create: (before: Node | null) => void,
	key?: any,
	name?: string,
): ListItem {
	return {
		startNode: null,
		endNode: null,
		previousRegion: null,
		nextRegion: null,
		depth: -1,
		animations: null,
		name,
		index,
		state: 2,
		create,
		data,
		key,
	};
}
