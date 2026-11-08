import type BuildOptions from "../../types/BuildOptions";

export default interface BuildServerStatus {
	imports: Set<string>;
	output: string;
	styleHash: string;
	varNames: Record<string, number>;
	preserveWhitespace: boolean;
	/** Whether the output is being built inside a @head block */
	inHead?: boolean;
	/** Counter for `@await` boundary site ids within this build chunk */
	awaitCount: number;
	/**
	 * The open element tags around the node being built (nearest last).
	 * Used to guard slot regions whose wrapper the HTML parser can
	 * auto-close — see ssr/slotAutoClose.
	 */
	elementStack: string[];
	options?: BuildOptions;
}
