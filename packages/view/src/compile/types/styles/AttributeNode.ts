import type StyleNode from "./StyleNode";

export default interface AttributeNode extends StyleNode {
	type: "attribute";
	name: string;
	value: string;
}
