import type BuildOptions from "../../types/BuildOptions";

export default interface BuildServerStatus {
	imports: Set<string>;
	output: string;
	styleHash: string;
	varNames: Record<string, number>;
	preserveWhitespace: boolean;
	/** Whether the output is being built inside a @head block */
	inHead?: boolean;
	options?: BuildOptions;
}
