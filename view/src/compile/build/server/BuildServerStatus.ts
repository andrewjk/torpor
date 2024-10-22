import type BuildOptions from "../../../types/BuildOptions";

export default interface BuildServerStatus {
	output: string;
	styleHash: string;
	varNames: Record<string, number>;
	options?: BuildOptions;
}
