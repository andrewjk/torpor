import type ListItem from "../types/ListItem";

export default function newListItem(data: Record<PropertyKey, any>, key?: any): ListItem {
	return {
		startNode: null,
		endNode: null,
		previousRange: null,
		nextRange: null,
		depth: -1,
		animations: null,
		data,
		key,
	};
}
