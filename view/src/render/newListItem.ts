import { type ListItem } from "../types/ListItem";

export default function newListItem(data: Record<PropertyKey, any>, key?: any): ListItem {
	return {
		startNode: null,
		endNode: null,
		children: null,
		index: 0,
		effects: null,
		animations: null,
		data,
		key,
	};
}
