import type StyleNode from "./StyleNode";

export default interface BlockNode extends StyleNode {
	type: "block";
	selector: string;
	children: StyleNode[];
}
