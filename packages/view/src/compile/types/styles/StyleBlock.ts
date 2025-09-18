import type Attribute from "./Attribute";

export default interface StyleBlock {
	selector: string;
	attributes: Attribute[];
	children: StyleBlock[];
}
