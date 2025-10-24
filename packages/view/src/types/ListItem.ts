import type Region from "./Region";

export default interface ListItem extends Region {
	data: Record<string, any>;
	key: any;
	index: number;
	//newIndex: number;
	state: number;

	create: (before: Node | null) => void;
	//update: (newData: Record<string, any>) => void;
}
