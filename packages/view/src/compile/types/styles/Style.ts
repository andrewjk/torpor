import type StyleBlock from "./StyleBlock";

export default interface Style {
	global: boolean;
	blocks: StyleBlock[];
	hash: string;
}
