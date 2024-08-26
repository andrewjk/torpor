import type Range from "../../global/types/Range";

export default interface ListItem extends Range {
	key: any;
	data: Record<string, any>;
	//range: Range;
}
