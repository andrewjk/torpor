import type Range from "./Range";

export default interface ListItem extends Range {
	key: any;
	data: Record<string, any>;
}
