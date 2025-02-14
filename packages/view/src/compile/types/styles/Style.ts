import { type StyleBlock } from "./StyleBlock";

export type Style = {
	global: boolean;
	blocks: StyleBlock[];
	hash: string;
};
