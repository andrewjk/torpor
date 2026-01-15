import type StyleNode from "./StyleNode";

export default interface CommentNode extends StyleNode {
	type: "comment";
	content: string;
}
