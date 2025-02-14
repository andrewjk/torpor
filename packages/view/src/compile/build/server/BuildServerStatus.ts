import { type BuildOptions } from "../../../types/BuildOptions";

export type BuildServerStatus = {
	imports: Set<string>;
	output: string;
	styleHash: string;
	varNames: Record<string, number>;
	preserveWhitespace: boolean;
	options?: BuildOptions;
};
