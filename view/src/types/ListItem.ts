import type Range from "./Range";

export default interface ListItem extends Range {
	data: Record<string, any>;
	key: any;
}
