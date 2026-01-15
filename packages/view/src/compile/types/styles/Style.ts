import type StyleNode from "./StyleNode";

export default interface Style {
	global: boolean;
	children: StyleNode[];
	hash: string;
}
