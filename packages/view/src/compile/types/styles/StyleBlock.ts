import { type Attribute } from "./Attribute";

export type StyleBlock = {
	selector: string;
	attributes: Attribute[];
	children: StyleBlock[];
};
