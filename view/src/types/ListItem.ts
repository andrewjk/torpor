import { type Range } from "./Range";

export type ListItem = Range & {
	data: Record<string, any>;
	key: any;
};
